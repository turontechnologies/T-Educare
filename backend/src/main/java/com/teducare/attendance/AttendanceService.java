package com.teducare.attendance;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.leave.LeaveRequest;
import com.teducare.leave.LeaveRequestService;
import com.teducare.staff.StaffMemberResponse;
import com.teducare.staff.StaffMemberService;

/**
 * Time &amp; Attendance (API_CONTRACT.md) — institution-wide clock-in rules,
 * registered biometric devices, and the append-only clock-event log, with
 * daily PRESENT/LATE/ABSENT status always <em>derived</em> at read time
 * rather than stored (see {@link AttendanceEvent}'s own doc comment for
 * why). Time-of-day comparisons are UTC throughout, the same "no
 * per-institution timezone modeling" convention every other date/time
 * field in this backend already follows (Academic Sessions, Staff
 * employment dates, etc.) — a device's {@code occurredAt} is expected to
 * already be a real timestamp, not a bare local clock reading.
 */
@Service
public class AttendanceService {

    private static final Set<String> EVENT_TYPES = Set.of("CLOCK_IN", "CLOCK_OUT");
    private static final Set<String> DAYS_OF_WEEK = Set.of(
            "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY");
    private static final String API_KEY_ALPHABET =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AttendanceSettingsRepository settingsRepository;
    private final AttendanceDeviceRepository deviceRepository;
    private final AttendanceEventRepository eventRepository;
    private final StaffMemberService staffMemberService;
    private final PasswordEncoder passwordEncoder;
    private final LeaveRequestService leaveRequestService;

    public AttendanceService(
            AttendanceSettingsRepository settingsRepository,
            AttendanceDeviceRepository deviceRepository,
            AttendanceEventRepository eventRepository,
            StaffMemberService staffMemberService,
            PasswordEncoder passwordEncoder,
            LeaveRequestService leaveRequestService) {
        this.settingsRepository = settingsRepository;
        this.deviceRepository = deviceRepository;
        this.eventRepository = eventRepository;
        this.staffMemberService = staffMemberService;
        this.passwordEncoder = passwordEncoder;
        this.leaveRequestService = leaveRequestService;
    }

    // --- Settings ---

    public AttendanceSettingsResponse getSettings(String institutionId) {
        return AttendanceSettingsResponse.from(requireSettings(institutionId));
    }

    public AttendanceSettingsResponse updateSettings(String institutionId, UpdateAttendanceSettingsRequest request) {
        AttendanceSettings settings = requireSettings(institutionId);

        if (isPresent(request.resumptionTime())) {
            validateTime(request.resumptionTime(), "resumptionTime");
            settings.setResumptionTime(request.resumptionTime());
        }
        if (isPresent(request.closingTime())) {
            validateTime(request.closingTime(), "closingTime");
            settings.setClosingTime(request.closingTime());
        }
        if (request.gracePeriodMinutes() != null) {
            if (request.gracePeriodMinutes() < 0 || request.gracePeriodMinutes() > 180) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "gracePeriodMinutes must be between 0 and 180.");
            }
            settings.setGracePeriodMinutes(request.gracePeriodMinutes());
        }
        if (request.workdays() != null) {
            if (request.workdays().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one workday.");
            }
            for (String day : request.workdays()) {
                if (!DAYS_OF_WEEK.contains(day)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid day of week: " + day);
                }
            }
            settings.setWorkdays(String.join(",", request.workdays()));
        }

        settings.setUpdatedAt(Instant.now());
        return AttendanceSettingsResponse.from(settingsRepository.save(settings));
    }

    /** Get-or-create-default — every institution has sensible defaults from the moment this module is first opened, no separate setup step required. */
    private AttendanceSettings requireSettings(String institutionId) {
        return settingsRepository.findByInstitutionId(institutionId)
                .orElseGet(() -> settingsRepository.save(new AttendanceSettings(
                        institutionId, "08:00", "17:00", 15,
                        "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY", Instant.now())));
    }

    // --- Devices ---

    public List<AttendanceDeviceResponse> listDevices(String institutionId) {
        return deviceRepository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .map(AttendanceDeviceResponse::from)
                .toList();
    }

    public AttendanceDeviceCreatedResponse createDevice(String institutionId, CreateAttendanceDeviceRequest request) {
        String apiKey = generateApiKey();
        AttendanceDevice device = new AttendanceDevice(
                "device-" + UUID.randomUUID(),
                institutionId,
                request.name(),
                request.location(),
                passwordEncoder.encode(apiKey),
                "active",
                null,
                Instant.now(),
                null);
        AttendanceDevice saved = deviceRepository.save(device);
        return new AttendanceDeviceCreatedResponse(AttendanceDeviceResponse.from(saved), apiKey);
    }

    public AttendanceDeviceResponse revokeDevice(String institutionId, String id) {
        AttendanceDevice device = deviceRepository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Device not found."));
        device.setStatus("revoked");
        device.setRevokedAt(Instant.now());
        return AttendanceDeviceResponse.from(deviceRepository.save(device));
    }

    private String generateApiKey() {
        StringBuilder sb = new StringBuilder("tdat_");
        for (int i = 0; i < 32; i++) {
            sb.append(API_KEY_ALPHABET.charAt(RANDOM.nextInt(API_KEY_ALPHABET.length())));
        }
        return sb.toString();
    }

    // --- Clock events ---

    /**
     * The one endpoint a biometric device/middleware ever calls. No JWT —
     * the device authenticates with its own API key, checked here against
     * every active device's hash (there is no indexable lookup for a
     * bcrypt hash; fine at the scale of "devices per institution").
     */
    public AttendanceEventResponse recordDeviceClockEvent(String apiKey, ClockEventRequest request) {
        AttendanceDevice device = deviceRepository.findByStatus("active").stream()
                .filter(d -> passwordEncoder.matches(apiKey, d.getApiKeyHash()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid device API key."));

        validateEventType(request.eventType());
        String staffInternalId = resolveStaffInternalId(device.getInstitutionId(), request.staffId());

        Instant occurredAt = isPresent(request.occurredAt()) ? parseInstant(request.occurredAt()) : Instant.now();

        AttendanceEvent event = new AttendanceEvent(
                "attevt-" + UUID.randomUUID(),
                device.getInstitutionId(),
                staffInternalId,
                request.eventType(),
                occurredAt,
                device.getId(),
                "DEVICE",
                null,
                null,
                Instant.now());
        AttendanceEvent saved = eventRepository.save(event);

        device.setLastSeenAt(Instant.now());
        deviceRepository.save(device);

        return AttendanceEventResponse.from(saved);
    }

    public AttendanceEventResponse recordManualEvent(String institutionId, String actorId, RecordManualAttendanceRequest request) {
        validateEventType(request.eventType());
        String staffInternalId = resolveStaffInternalId(institutionId, request.staffId());
        Instant occurredAt = parseInstant(request.occurredAt());

        AttendanceEvent event = new AttendanceEvent(
                "attevt-" + UUID.randomUUID(),
                institutionId,
                staffInternalId,
                request.eventType(),
                occurredAt,
                null,
                "MANUAL",
                request.note(),
                actorId,
                Instant.now());
        return AttendanceEventResponse.from(eventRepository.save(event));
    }

    // --- Overview & history ---

    public AttendanceOverviewResponse getOverview(String institutionId, LocalDate date) {
        AttendanceSettings settings = requireSettings(institutionId);
        List<StaffMemberResponse> staff = staffMemberService.list(institutionId, null, null, false);

        Instant dayStart = date.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant dayEnd = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        List<AttendanceEvent> dayEvents =
                eventRepository.findByInstitutionIdAndOccurredAtBetweenOrderByOccurredAtAsc(institutionId, dayStart, dayEnd);

        // One query for every staff member on approved leave today, instead
        // of one query per staff member — matches the N+1-avoidance already
        // used for dayEvents above.
        Map<String, LeaveRequest> onLeaveByStaffId = new HashMap<>();
        for (LeaveRequest leave : leaveRequestService.findApprovedCoveringDateForOverview(institutionId, date)) {
            onLeaveByStaffId.put(leave.getStaffId(), leave);
        }

        List<DailyAttendanceEntry> entries = new ArrayList<>();
        int present = 0;
        int late = 0;
        int absent = 0;
        int notClockedIn = 0;
        int onLeave = 0;
        boolean isWorkday = settings.getWorkdays().contains(date.getDayOfWeek().name());

        for (StaffMemberResponse member : staff) {
            List<AttendanceEvent> memberEvents = dayEvents.stream()
                    .filter(e -> e.getStaffId().equals(member.id()))
                    .toList();
            LeaveRequest leave = onLeaveByStaffId.get(member.id());
            DailyAttendanceEntry entry = computeEntry(member, date, settings, memberEvents, isWorkday, leave);
            entries.add(entry);
            switch (entry.status()) {
                case "PRESENT" -> present++;
                case "LATE" -> late++;
                case "ABSENT" -> absent++;
                case "NOT_CLOCKED_IN" -> notClockedIn++;
                case "ON_LEAVE" -> onLeave++;
                default -> { }
            }
        }

        return new AttendanceOverviewResponse(
                date.toString(), isWorkday, staff.size(), present, late, absent, notClockedIn, onLeave, entries);
    }

    public List<DailyAttendanceEntry> getStaffHistory(String institutionId, String staffId, LocalDate from, LocalDate to) {
        String staffInternalId = resolveStaffInternalId(institutionId, staffId);
        return buildHistory(institutionId, staffInternalId, from, to);
    }

    /** Self-service — {@code callerStaffId} must be the caller's OWN internal StaffMember id, resolved server-side from their session, never client-supplied. */
    public List<DailyAttendanceEntry> getMyHistory(String institutionId, String callerStaffId, LocalDate from, LocalDate to) {
        return buildHistory(institutionId, callerStaffId, from, to);
    }

    private List<DailyAttendanceEntry> buildHistory(String institutionId, String staffInternalId, LocalDate from, LocalDate to) {
        AttendanceSettings settings = requireSettings(institutionId);
        StaffMemberResponse staffResponse = staffMemberService.get(institutionId, staffInternalId);

        Instant rangeStart = from.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant rangeEnd = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        List<AttendanceEvent> events = eventRepository
                .findByInstitutionIdAndStaffIdAndOccurredAtBetweenOrderByOccurredAtAsc(
                        institutionId, staffInternalId, rangeStart, rangeEnd);
        List<LeaveRequest> approvedLeaves =
                leaveRequestService.findApprovedOverlappingForHistory(institutionId, staffInternalId, from, to);

        List<DailyAttendanceEntry> history = new ArrayList<>();
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            boolean isWorkday = settings.getWorkdays().contains(date.getDayOfWeek().name());
            LocalDate finalDate = date;
            List<AttendanceEvent> dayEvents = events.stream()
                    .filter(e -> e.getOccurredAt().atZone(ZoneOffset.UTC).toLocalDate().equals(finalDate))
                    .toList();
            LeaveRequest leave = approvedLeaves.stream()
                    .filter(l -> !finalDate.isBefore(l.getStartDate()) && !finalDate.isAfter(l.getEndDate()))
                    .findFirst()
                    .orElse(null);
            history.add(computeEntry(staffResponse, date, settings, dayEvents, isWorkday, leave));
        }
        return history;
    }

    private DailyAttendanceEntry computeEntry(
            StaffMemberResponse member, LocalDate date, AttendanceSettings settings,
            List<AttendanceEvent> dayEvents, boolean isWorkday, LeaveRequest leave) {
        String staffName = member.firstName() + " " + member.lastName();

        if (leave != null) {
            String leaveTypeName = leaveRequestService.leaveTypeName(leave.getLeaveTypeId()).orElse("Leave");
            return new DailyAttendanceEntry(member.id(), member.staffId(), staffName, "ON_LEAVE", null, null, leaveTypeName);
        }

        if (!isWorkday) {
            return new DailyAttendanceEntry(member.id(), member.staffId(), staffName, "NON_WORKDAY", null, null, null);
        }

        Instant clockIn = dayEvents.stream()
                .filter(e -> "CLOCK_IN".equals(e.getEventType()))
                .map(AttendanceEvent::getOccurredAt)
                .min(Instant::compareTo)
                .orElse(null);
        Instant clockOut = dayEvents.stream()
                .filter(e -> "CLOCK_OUT".equals(e.getEventType()))
                .map(AttendanceEvent::getOccurredAt)
                .max(Instant::compareTo)
                .orElse(null);

        boolean isToday = date.equals(LocalDate.now(ZoneOffset.UTC));

        if (clockIn == null) {
            String status = isToday ? "NOT_CLOCKED_IN" : "ABSENT";
            return new DailyAttendanceEntry(member.id(), member.staffId(), staffName, status, null, clockOut, null);
        }

        LocalTime clockInTime = clockIn.atZone(ZoneOffset.UTC).toLocalTime();
        LocalTime cutoff = LocalTime.parse(settings.getResumptionTime()).plusMinutes(settings.getGracePeriodMinutes());
        String status = clockInTime.isAfter(cutoff) ? "LATE" : "PRESENT";
        return new DailyAttendanceEntry(member.id(), member.staffId(), staffName, status, clockIn, clockOut, null);
    }

    /** Accepts either a real StaffMember.id or its human-readable staffId code — a device/admin naturally has the code, not the internal id. */
    private String resolveStaffInternalId(String institutionId, String staffIdOrCode) {
        return staffMemberService.list(institutionId, null, null, false).stream()
                .filter(s -> s.id().equals(staffIdOrCode) || s.staffId().equalsIgnoreCase(staffIdOrCode))
                .map(StaffMemberResponse::id)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff member not found: " + staffIdOrCode));
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    private static void validateEventType(String eventType) {
        if (!EVENT_TYPES.contains(eventType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "eventType must be CLOCK_IN or CLOCK_OUT.");
        }
    }

    private static void validateTime(String value, String field) {
        try {
            LocalTime.parse(value, DateTimeFormatter.ofPattern("HH:mm"));
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be in HH:mm (24-hour) format.");
        }
    }

    private static Instant parseInstant(String value) {
        try {
            return Instant.parse(value);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "occurredAt must be a valid ISO-8601 timestamp.");
        }
    }
}
