package com.teducare.leave;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.attendance.AttendanceSettings;
import com.teducare.attendance.AttendanceSettingsRepository;
import com.teducare.staff.StaffMemberResponse;
import com.teducare.staff.StaffMemberService;

/**
 * Leave requests — a staff member's own submission through its whole
 * approve/reject/resume lifecycle, plus the always-computed-at-read-time
 * balance (see {@link LeaveBalanceResponse}'s doc comment). {@link
 * #isOnApprovedLeave} is the one method {@code AttendanceService} calls
 * directly to turn an ABSENT/NOT_CLOCKED_IN day into ON_LEAVE.
 */
@Service
public class LeaveRequestService {

    private final LeaveRequestRepository repository;
    private final LeaveTypeRepository typeRepository;
    private final LeaveTypeService typeService;
    private final StaffMemberService staffMemberService;
    private final AttendanceSettingsRepository attendanceSettingsRepository;

    public LeaveRequestService(
            LeaveRequestRepository repository,
            LeaveTypeRepository typeRepository,
            LeaveTypeService typeService,
            StaffMemberService staffMemberService,
            AttendanceSettingsRepository attendanceSettingsRepository) {
        this.repository = repository;
        this.typeRepository = typeRepository;
        this.typeService = typeService;
        this.staffMemberService = staffMemberService;
        this.attendanceSettingsRepository = attendanceSettingsRepository;
    }

    // --- Admin ---

    public List<LeaveRequestResponse> listForInstitution(String institutionId, String status, String staffId) {
        List<LeaveRequest> requests = isPresent(status)
                ? repository.findByInstitutionIdAndStatusOrderByCreatedAtDesc(institutionId, status.toUpperCase())
                : repository.findByInstitutionIdOrderByCreatedAtDesc(institutionId);
        if (isPresent(staffId)) {
            String internalId = resolveStaffInternalId(institutionId, staffId);
            requests = requests.stream().filter(r -> r.getStaffId().equals(internalId)).toList();
        }
        return enrich(institutionId, requests);
    }

    public LeaveRequestResponse approve(String institutionId, String id, String actorId, ReviewLeaveRequestRequest request) {
        LeaveRequest leaveRequest = requireOwnRequest(institutionId, id);
        requirePending(leaveRequest);
        leaveRequest.setStatus("APPROVED");
        leaveRequest.setReviewedBy(actorId);
        leaveRequest.setReviewedAt(Instant.now());
        leaveRequest.setReviewNote(request.note());
        return enrichOne(institutionId, repository.save(leaveRequest));
    }

    public LeaveRequestResponse reject(String institutionId, String id, String actorId, ReviewLeaveRequestRequest request) {
        if (!isPresent(request.note())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A reason is required to reject a leave request.");
        }
        LeaveRequest leaveRequest = requireOwnRequest(institutionId, id);
        requirePending(leaveRequest);
        leaveRequest.setStatus("REJECTED");
        leaveRequest.setReviewedBy(actorId);
        leaveRequest.setReviewedAt(Instant.now());
        leaveRequest.setReviewNote(request.note());
        return enrichOne(institutionId, repository.save(leaveRequest));
    }

    /** Every staff member's balance across every active leave type — the admin overview table. */
    public List<StaffLeaveBalances> listBalancesForInstitution(String institutionId, int year) {
        List<StaffMemberResponse> staff = staffMemberService.list(institutionId, null, null, false);
        return staff.stream()
                .map(member -> new StaffLeaveBalances(
                        member.id(), member.staffId(), member.firstName() + " " + member.lastName(),
                        balancesFor(institutionId, member.id(), year)))
                .toList();
    }

    // --- Self-service ---

    public LeaveRequestResponse create(String institutionId, String staffId, CreateLeaveRequestRequest request) {
        LeaveType type = typeService.requireActiveType(institutionId, request.leaveTypeId());
        LocalDate start = parseDate(request.startDate(), "startDate");
        LocalDate end = parseDate(request.endDate(), "endDate");
        if (end.isBefore(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endDate cannot be before startDate.");
        }
        if (!repository.findActiveOverlapping(institutionId, staffId, start, end).isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "You already have a pending or approved leave request overlapping these dates.");
        }

        int totalDays = countWorkdays(institutionId, start, end);
        LeaveRequest leaveRequest = new LeaveRequest(
                "leavereq-" + UUID.randomUUID(),
                institutionId,
                staffId,
                type.getId(),
                start,
                end,
                totalDays,
                request.reason(),
                "PENDING",
                null, null, null, null, null,
                Instant.now());
        return enrichOne(institutionId, repository.save(leaveRequest));
    }

    public List<LeaveRequestResponse> listForStaff(String institutionId, String staffId) {
        return enrich(institutionId, repository.findByInstitutionIdAndStaffIdOrderByCreatedAtDesc(institutionId, staffId));
    }

    public LeaveRequestResponse cancel(String institutionId, String staffId, String id) {
        LeaveRequest leaveRequest = requireOwnRequest(institutionId, id);
        requireOwnStaffRequest(leaveRequest, staffId);
        if (!"PENDING".equals(leaveRequest.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only a pending request can be cancelled.");
        }
        leaveRequest.setStatus("CANCELLED");
        return enrichOne(institutionId, repository.save(leaveRequest));
    }

    public LeaveRequestResponse submitResumption(String institutionId, String staffId, String id, SubmitResumptionRequest request) {
        LeaveRequest leaveRequest = requireOwnRequest(institutionId, id);
        requireOwnStaffRequest(leaveRequest, staffId);
        if (!"APPROVED".equals(leaveRequest.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only an approved leave request can be resumed from.");
        }
        if (leaveRequest.getResumedAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A resumption report has already been submitted for this leave.");
        }
        leaveRequest.setResumedAt(Instant.now());
        leaveRequest.setResumptionNote(request.note());
        return enrichOne(institutionId, repository.save(leaveRequest));
    }

    public List<LeaveBalanceResponse> balancesFor(String institutionId, String staffId, int year) {
        List<LeaveType> types = typeRepository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(t -> t.getArchivedAt() == null)
                .toList();

        return types.stream().map(type -> {
            int used = usedDays(institutionId, staffId, type.getId(), year);
            int rolloverDays = type.isRollover() ? rolloverDaysInto(institutionId, staffId, type, year) : 0;
            int allocated = type.getDefaultDaysPerYear() + rolloverDays;
            return new LeaveBalanceResponse(
                    type.getId(), type.getName(), year, type.getDefaultDaysPerYear(), rolloverDays, used, allocated - used);
        }).toList();
    }

    /** Unused days from last year, capped at maxRolloverDays (uncapped if null) — 0 if the type doesn't roll over or last year had no deficit to roll forward. */
    private int rolloverDaysInto(String institutionId, String staffId, LeaveType type, int year) {
        int lastYearUsed = usedDays(institutionId, staffId, type.getId(), year - 1);
        int lastYearUnused = Math.max(0, type.getDefaultDaysPerYear() - lastYearUsed);
        return type.getMaxRolloverDays() == null
                ? lastYearUnused
                : Math.min(lastYearUnused, type.getMaxRolloverDays());
    }

    private int usedDays(String institutionId, String staffId, String leaveTypeId, int year) {
        LocalDate yearStart = LocalDate.of(year, 1, 1);
        LocalDate yearEnd = LocalDate.of(year, 12, 31);
        return repository.findApprovedOverlapping(institutionId, staffId, yearStart, yearEnd).stream()
                .filter(r -> r.getLeaveTypeId().equals(leaveTypeId))
                .mapToInt(LeaveRequest::getTotalDays)
                .sum();
    }

    /** Called by AttendanceService — the one integration point between the two modules. */
    public Optional<LeaveRequest> isOnApprovedLeave(String institutionId, String staffId, LocalDate date) {
        return repository.findApprovedCoveringDate(institutionId, date).stream()
                .filter(r -> r.getStaffId().equals(staffId))
                .findFirst();
    }

    public Optional<String> leaveTypeName(String leaveTypeId) {
        return typeRepository.findById(leaveTypeId).map(LeaveType::getName);
    }

    // --- shared helpers ---

    private int countWorkdays(String institutionId, LocalDate start, LocalDate end) {
        AttendanceSettings settings = attendanceSettingsRepository.findByInstitutionId(institutionId).orElse(null);
        Set<String> workdays = settings == null
                ? Set.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY")
                : Set.of(settings.getWorkdays().split(","));
        int count = 0;
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            if (workdays.contains(date.getDayOfWeek().name())) {
                count++;
            }
        }
        return Math.max(count, 1);
    }

    private List<LeaveRequestResponse> enrich(String institutionId, List<LeaveRequest> requests) {
        return requests.stream().map(r -> enrichOne(institutionId, r)).toList();
    }

    private LeaveRequestResponse enrichOne(String institutionId, LeaveRequest r) {
        StaffMemberResponse staff = staffMemberService.get(institutionId, r.getStaffId());
        String typeName = typeRepository.findById(r.getLeaveTypeId()).map(LeaveType::getName).orElse("—");
        return new LeaveRequestResponse(
                r.getId(), staff.id(), staff.staffId(), staff.firstName() + " " + staff.lastName(),
                r.getLeaveTypeId(), typeName,
                r.getStartDate(), r.getEndDate(), r.getTotalDays(), r.getReason(), r.getStatus(),
                r.getReviewedBy(), r.getReviewedAt(), r.getReviewNote(),
                r.getResumedAt(), r.getResumptionNote(), r.getCreatedAt());
    }

    private LeaveRequest requireOwnRequest(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave request not found."));
    }

    private static void requireOwnStaffRequest(LeaveRequest leaveRequest, String staffId) {
        if (!leaveRequest.getStaffId().equals(staffId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave request not found.");
        }
    }

    private static void requirePending(LeaveRequest leaveRequest) {
        if (!"PENDING".equals(leaveRequest.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This leave request has already been reviewed.");
        }
    }

    private String resolveStaffInternalId(String institutionId, String staffIdOrCode) {
        return staffMemberService.list(institutionId, null, null, false).stream()
                .filter(s -> s.id().equals(staffIdOrCode) || s.staffId().equalsIgnoreCase(staffIdOrCode))
                .map(StaffMemberResponse::id)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff member not found: " + staffIdOrCode));
    }

    private static LocalDate parseDate(String value, String field) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be a valid date (yyyy-MM-dd).");
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    public record StaffLeaveBalances(
            String staffId, String staffCode, String staffName, List<LeaveBalanceResponse> balances) {
    }
}
