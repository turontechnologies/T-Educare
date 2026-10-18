package com.teducare.leave;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
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
 * balance (see {@link LeaveBalanceResponse}'s doc comment).
 *
 * <p><b>The resumption rule, in one place</b>: an APPROVED request's real
 * "last day on leave" is never just the stored {@code endDate} — it's
 * {@link #effectiveEndDate}, computed fresh on every read:
 * <ul>
 *   <li>Resumption APPROVED by admin: the real end is the day before the
 *       confirmed {@code resumptionDate} — before {@code endDate} credits
 *       unused days back, after it confirms extra days were used.</li>
 *   <li>No APPROVED resumption yet, and today has already passed {@code
 *       endDate}: the real end is <em>today</em> — the leave is silently
 *       extending every single day nobody reports a return, and both the
 *       balance and Attendance keep counting it.</li>
 *   <li>Otherwise: the real end is just {@code endDate}, as planned.</li>
 * </ul>
 * A resumption report submitted after that auto-extension has already
 * started (i.e. after {@code endDate}) is functionally the appeal that
 * corrects it — same mechanism, just carrying a required {@code
 * lateReason} and, once approved, crediting back whatever was
 * over-deducted in the meantime. {@link #findCoveringDate} is
 * {@code AttendanceService}'s one integration point.
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

    public List<LeaveRequestResponse> listForInstitution(
            String institutionId, String status, String staffId, String resumptionStatus) {
        List<LeaveRequest> requests = isPresent(status)
                ? repository.findByInstitutionIdAndStatusOrderByCreatedAtDesc(institutionId, status.toUpperCase())
                : repository.findByInstitutionIdOrderByCreatedAtDesc(institutionId);
        if (isPresent(staffId)) {
            String internalId = resolveStaffInternalId(institutionId, staffId);
            requests = requests.stream().filter(r -> r.getStaffId().equals(internalId)).toList();
        }
        if (isPresent(resumptionStatus)) {
            requests = requests.stream()
                    .filter(r -> resumptionStatus.equalsIgnoreCase(r.getResumptionStatus()))
                    .toList();
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

    /**
     * Admin confirms the staff member's claimed resumption date — this is
     * the one action that actually moves days (back into, or further out
     * of, their balance). Works identically whether this was a prompt,
     * on-time report or a late appeal; the correction is the same either
     * way, just the direction/size of {@code daysRestored} differs.
     */
    public LeaveRequestResponse approveResumption(String institutionId, String id, String actorId, ReviewLeaveRequestRequest request) {
        LeaveRequest leaveRequest = requireOwnRequest(institutionId, id);
        requirePendingResumption(leaveRequest);
        leaveRequest.setResumptionStatus("APPROVED");
        leaveRequest.setResumptionReviewedBy(actorId);
        leaveRequest.setResumptionReviewedAt(Instant.now());
        leaveRequest.setResumptionReviewNote(request.note());
        return enrichOne(institutionId, repository.save(leaveRequest));
    }

    /** Admin disputes the claimed resumption date — the request reverts to "no confirmed resumption," so auto-extension (if applicable) resumes counting live from where it was. The staff member may submit a new report. */
    public LeaveRequestResponse rejectResumption(String institutionId, String id, String actorId, ReviewLeaveRequestRequest request) {
        if (!isPresent(request.note())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A reason is required to reject a resumption report.");
        }
        LeaveRequest leaveRequest = requireOwnRequest(institutionId, id);
        requirePendingResumption(leaveRequest);
        leaveRequest.setResumptionStatus("REJECTED");
        leaveRequest.setResumptionReviewedBy(actorId);
        leaveRequest.setResumptionReviewedAt(Instant.now());
        leaveRequest.setResumptionReviewNote(request.note());
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
                null, null, null,
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

    /**
     * Staff member reports their actual resumption date — works whether
     * this is a prompt on-time report or a late appeal correcting an
     * already-auto-extending leave; {@code lateReason} is required exactly
     * when today is already past {@code endDate} at submission time, since
     * that's the one fact the client can't be trusted to self-certify.
     * Does not move any balance by itself — only {@link #approveResumption}
     * does, deliberately, so a staff member can't unilaterally credit
     * themselves days back.
     */
    public LeaveRequestResponse submitResumption(String institutionId, String staffId, String id, SubmitResumptionRequest request) {
        LeaveRequest leaveRequest = requireOwnRequest(institutionId, id);
        requireOwnStaffRequest(leaveRequest, staffId);
        if (!"APPROVED".equals(leaveRequest.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only an approved leave request can be resumed from.");
        }
        if ("APPROVED".equals(leaveRequest.getResumptionStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A resumption has already been confirmed for this leave.");
        }

        LocalDate resumptionDate = parseDate(request.resumptionDate(), "resumptionDate");
        if (resumptionDate.isBefore(leaveRequest.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "resumptionDate cannot be before the leave's startDate.");
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        boolean isLate = today.isAfter(leaveRequest.getEndDate());
        if (isLate && !isPresent(request.lateReason())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This leave's end date has already passed without a resumption report — explain the delay in lateReason to appeal it.");
        }

        leaveRequest.setResumptionDate(resumptionDate);
        leaveRequest.setResumptionReportedAt(Instant.now());
        leaveRequest.setResumptionNote(request.note());
        leaveRequest.setResumptionLateReason(isLate ? request.lateReason() : null);
        leaveRequest.setResumptionStatus("PENDING");
        return enrichOne(institutionId, repository.save(leaveRequest));
    }

    public List<LeaveBalanceResponse> balancesFor(String institutionId, String staffId, int year) {
        List<LeaveType> types = typeRepository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(t -> t.getArchivedAt() == null)
                .toList();
        StaffMemberResponse staff = staffMemberService.get(institutionId, staffId);

        return types.stream().map(type -> {
            int used = usedDays(institutionId, staffId, type.getId(), year);
            int rolloverDays = type.isRollover() ? rolloverDaysInto(institutionId, staffId, type, year, staff) : 0;
            int allocated = type.getDefaultDaysPerYear() + rolloverDays;
            return new LeaveBalanceResponse(
                    type.getId(), type.getName(), year, type.getDefaultDaysPerYear(), rolloverDays, used, allocated - used);
        }).toList();
    }

    /**
     * Unused days from last year, capped at maxRolloverDays (uncapped if
     * null) — 0 if the type doesn't roll over, if last year had no deficit
     * to roll forward, or (the actual bug this guards against) if the staff
     * member wasn't even employed for the whole of last year, or the leave
     * type itself didn't exist yet — neither can have "unused days" from a
     * year they weren't eligible for in the first place, so a brand new
     * hire or a freshly-created leave type must never show a rollover
     * credit out of nowhere.
     */
    private int rolloverDaysInto(String institutionId, String staffId, LeaveType type, int year, StaffMemberResponse staff) {
        LocalDate lastYearStart = LocalDate.of(year - 1, 1, 1);
        boolean staffEligibleForLastYear =
                !staff.employmentStartDate().atZone(ZoneOffset.UTC).toLocalDate().isAfter(lastYearStart);
        boolean typeExistedLastYear =
                !type.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().isAfter(lastYearStart);
        if (!staffEligibleForLastYear || !typeExistedLastYear) {
            return 0;
        }

        int lastYearUsed = usedDays(institutionId, staffId, type.getId(), year - 1);
        int lastYearUnused = Math.max(0, type.getDefaultDaysPerYear() - lastYearUsed);
        return type.getMaxRolloverDays() == null
                ? lastYearUnused
                : Math.min(lastYearUnused, type.getMaxRolloverDays());
    }

    /** Real days consumed this year against this leave type — using each request's effective end date, not blindly its stored totalDays, so an early-return credit or a live/confirmed extension both show up correctly. */
    private int usedDays(String institutionId, String staffId, String leaveTypeId, int year) {
        LocalDate yearStart = LocalDate.of(year, 1, 1);
        LocalDate yearEnd = LocalDate.of(year, 12, 31);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        return repository.findApprovedStartingOnOrBeforeForStaff(institutionId, staffId, yearEnd).stream()
                .filter(r -> r.getLeaveTypeId().equals(leaveTypeId))
                .filter(r -> !effectiveEndDate(r, today).isBefore(yearStart))
                .mapToInt(r -> effectiveDaysUsed(institutionId, r, today))
                .sum();
    }

    /** Every staff member's APPROVED leave effectively covering one day, including live auto-extensions — AttendanceService's integration point for a whole day's overview. */
    public List<LeaveRequest> findCoveringDate(String institutionId, LocalDate date) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        return repository.findApprovedStartingOnOrBefore(institutionId, date).stream()
                .filter(r -> !date.isAfter(effectiveEndDate(r, today)))
                .toList();
    }

    /** This staff member's APPROVED leave effectively overlapping [from, to], including live auto-extensions — lets AttendanceService check a date range in one query instead of one per day. */
    public List<LeaveRequest> findCoveringRangeForStaff(String institutionId, String staffId, LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        return repository.findApprovedStartingOnOrBeforeForStaff(institutionId, staffId, to).stream()
                .filter(r -> !effectiveEndDate(r, today).isBefore(from))
                .toList();
    }

    public Optional<String> leaveTypeName(String leaveTypeId) {
        return typeRepository.findById(leaveTypeId).map(LeaveType::getName);
    }

    /** The leave type's display name, suffixed to flag an unreported auto-extension — so an admin scanning Attendance can tell at a glance this isn't just an ordinary approved leave day. */
    public String attendanceLabelFor(LeaveRequest r) {
        String typeName = leaveTypeName(r.getLeaveTypeId()).orElse("Leave");
        return isAutoExtending(r, LocalDate.now(ZoneOffset.UTC)) ? typeName + " (unreported extension)" : typeName;
    }

    // --- the resumption rule itself ---

    /** See this class's own doc comment — the single place "what day did this leave actually end" is decided. */
    private LocalDate effectiveEndDate(LeaveRequest r, LocalDate today) {
        if ("APPROVED".equals(r.getResumptionStatus()) && r.getResumptionDate() != null) {
            return r.getResumptionDate().minusDays(1);
        }
        return today.isAfter(r.getEndDate()) ? today : r.getEndDate();
    }

    private int effectiveDaysUsed(String institutionId, LeaveRequest r, LocalDate today) {
        LocalDate effectiveEnd = effectiveEndDate(r, today);
        if (effectiveEnd.isBefore(r.getStartDate())) {
            return 0;
        }
        return countWorkdays(institutionId, r.getStartDate(), effectiveEnd);
    }

    private boolean isAutoExtending(LeaveRequest r, LocalDate today) {
        return "APPROVED".equals(r.getStatus())
                && !"APPROVED".equals(r.getResumptionStatus())
                && today.isAfter(r.getEndDate());
    }

    /** Only meaningful once resumptionStatus is APPROVED — positive means days credited back (early return), negative means extra days deducted (confirmed overstay), both relative to the originally-approved totalDays. */
    private Integer daysRestoredFor(String institutionId, LeaveRequest r) {
        if (!"APPROVED".equals(r.getResumptionStatus())) {
            return null;
        }
        int actualUsed = effectiveDaysUsed(institutionId, r, LocalDate.now(ZoneOffset.UTC));
        return r.getTotalDays() - actualUsed;
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
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        return new LeaveRequestResponse(
                r.getId(), staff.id(), staff.staffId(), staff.firstName() + " " + staff.lastName(),
                r.getLeaveTypeId(), typeName,
                r.getStartDate(), r.getEndDate(), r.getTotalDays(), r.getReason(), r.getStatus(),
                r.getReviewedBy(), r.getReviewedAt(), r.getReviewNote(),
                r.getResumptionDate(), r.getResumptionReportedAt(), r.getResumptionNote(),
                r.getResumptionLateReason(), r.getResumptionStatus(),
                r.getResumptionReviewedBy(), r.getResumptionReviewedAt(), r.getResumptionReviewNote(),
                isAutoExtending(r, today), daysRestoredFor(institutionId, r), r.getCreatedAt());
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

    private static void requirePendingResumption(LeaveRequest leaveRequest) {
        if (!"PENDING".equals(leaveRequest.getResumptionStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "There is no resumption report awaiting review for this leave.");
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
