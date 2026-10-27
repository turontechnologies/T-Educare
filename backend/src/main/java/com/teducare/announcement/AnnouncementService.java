package com.teducare.announcement;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.hostel.HostelResponse;
import com.teducare.hostel.HostelService;
import com.teducare.programlevel.ProgramLevelResponse;
import com.teducare.programlevel.ProgramLevelService;

/**
 * School/students/staff/hostel-residents broadcasts. See {@link
 * Announcement}'s own doc comment for the DRAFT/SCHEDULED/SENT lifecycle
 * and the "no real delivery fan-out" scoping note.
 *
 * <p>{@code targetScope} is one of:
 * <ul>
 *   <li>{@code SCHOOL_WIDE} — {@code targetValue} is always null/ignored; one option, "Entire School."</li>
 *   <li>{@code STUDENTS} — {@code targetValue} is {@code null}/"ALL" for "All students," or a real
 *       {@code ProgramLevel} id for one level.</li>
 *   <li>{@code STAFF} — {@code targetValue} is "ALL" for "All staff" or "LECTURERS" for just lecturers.</li>
 *   <li>{@code HOSTEL_RESIDENTS} — {@code targetValue} is a real {@code Hostel} id.</li>
 * </ul>
 */
@Service
public class AnnouncementService {

    public static final String SCHOOL_WIDE = "SCHOOL_WIDE";
    public static final String STUDENTS = "STUDENTS";
    public static final String STAFF = "STAFF";
    public static final String HOSTEL_RESIDENTS = "HOSTEL_RESIDENTS";
    private static final Set<String> SCOPES = Set.of(SCHOOL_WIDE, STUDENTS, STAFF, HOSTEL_RESIDENTS);
    private static final Set<String> STAFF_VALUES = Set.of("ALL", "LECTURERS");
    private static final Set<String> ACTIONS = Set.of("SEND", "SCHEDULE", "DRAFT");

    private final AnnouncementRepository repository;
    private final AnnouncementAttachmentRepository attachmentRepository;
    private final ProgramLevelService programLevelService;
    private final HostelService hostelService;

    public AnnouncementService(
            AnnouncementRepository repository,
            AnnouncementAttachmentRepository attachmentRepository,
            ProgramLevelService programLevelService,
            HostelService hostelService) {
        this.repository = repository;
        this.attachmentRepository = attachmentRepository;
        this.programLevelService = programLevelService;
        this.hostelService = hostelService;
    }

    public List<TargetOptionResponse> targetOptions(String institutionId, String scope) {
        requireValidScope(scope);
        return switch (scope) {
            case SCHOOL_WIDE -> List.of(new TargetOptionResponse("ALL", "Entire School"));
            case STUDENTS -> {
                List<TargetOptionResponse> options = new ArrayList<>();
                options.add(new TargetOptionResponse("ALL", "All students"));
                for (ProgramLevelResponse level : programLevelService.list(institutionId, false)) {
                    options.add(new TargetOptionResponse(level.id(), level.levelCode() + " Level students"));
                }
                yield options;
            }
            case STAFF -> List.of(
                    new TargetOptionResponse("ALL", "All staff"),
                    new TargetOptionResponse("LECTURERS", "Lecturers"));
            case HOSTEL_RESIDENTS -> hostelService.list(institutionId).stream()
                    .map(h -> new TargetOptionResponse(h.id(), h.name() + " residents"))
                    .toList();
            default -> throw new IllegalStateException("Unreachable");
        };
    }

    public List<AnnouncementResponse> list(String institutionId, String status) {
        List<Announcement> announcements = repository.findByInstitutionIdOrderByCreatedAtDesc(institutionId).stream()
                .filter(a -> status == null || status.isBlank() || status.equalsIgnoreCase(a.getStatus()))
                .toList();
        if (announcements.isEmpty()) {
            return List.of();
        }

        Map<String, String> levelLabelsById = programLevelService.list(institutionId, true).stream()
                .collect(Collectors.toMap(ProgramLevelResponse::id, l -> l.levelCode() + " Level students"));
        Map<String, String> hostelLabelsById = hostelService.list(institutionId).stream()
                .collect(Collectors.toMap(HostelResponse::id, h -> h.name() + " residents"));

        List<String> ids = announcements.stream().map(Announcement::getId).toList();
        Map<String, List<AttachmentResponse>> attachmentsByAnnouncementId = ids.stream()
                .collect(Collectors.toMap(
                        id -> id,
                        id -> attachmentRepository.findByAnnouncementIdOrderByCreatedAtAsc(id).stream()
                                .map(AttachmentResponse::from)
                                .toList()));

        return announcements.stream()
                .map(a -> toResponse(a, levelLabelsById, hostelLabelsById, attachmentsByAnnouncementId.get(a.getId())))
                .toList();
    }

    public AnnouncementResponse create(String institutionId, String callerName, CreateAnnouncementRequest request) {
        requireValidScope(request.targetScope());
        requireValidTargetValue(institutionId, request.targetScope(), request.targetValue());
        requireAtLeastOneChannel(request.sendViaApp(), request.sendViaEmail());
        requireValidAction(request.action());

        Instant now = Instant.now();
        String status = statusFor(request.action());
        Instant scheduledFor = resolveScheduledFor(request.action(), request.scheduledFor());

        Announcement announcement = new Announcement(
                "announcement-" + UUID.randomUUID(),
                institutionId,
                request.headline().trim(),
                request.body(),
                request.sendViaApp(),
                request.sendViaEmail(),
                request.targetScope(),
                normalizeTargetValue(request.targetValue()),
                status,
                scheduledFor,
                "SENT".equals(status) ? now : null,
                callerName,
                now,
                now);
        repository.save(announcement);
        saveAttachments(announcement.getId(), request.attachments());
        return toResponseOne(institutionId, announcement);
    }

    public AnnouncementResponse update(String institutionId, String id, UpdateAnnouncementRequest request) {
        Announcement announcement = requireOwnAnnouncement(institutionId, id);
        if (Announcement.SENT.equals(announcement.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A sent announcement can't be edited.");
        }

        requireValidScope(request.targetScope());
        requireValidTargetValue(institutionId, request.targetScope(), request.targetValue());
        requireAtLeastOneChannel(request.sendViaApp(), request.sendViaEmail());
        requireValidAction(request.action());

        String status = statusFor(request.action());
        Instant scheduledFor = resolveScheduledFor(request.action(), request.scheduledFor());
        Instant now = Instant.now();

        announcement.setHeadline(request.headline().trim());
        announcement.setBody(request.body());
        announcement.setSendViaApp(request.sendViaApp());
        announcement.setSendViaEmail(request.sendViaEmail());
        announcement.setTargetScope(request.targetScope());
        announcement.setTargetValue(normalizeTargetValue(request.targetValue()));
        announcement.setStatus(status);
        announcement.setScheduledFor(scheduledFor);
        if ("SENT".equals(status)) {
            announcement.setSentAt(now);
        }
        announcement.setUpdatedAt(now);
        repository.save(announcement);

        attachmentRepository.deleteByAnnouncementId(id);
        saveAttachments(id, request.attachments());

        return toResponseOne(institutionId, announcement);
    }

    /** "Send now" — from DRAFT or SCHEDULED, immediately -> SENT. */
    public AnnouncementResponse sendNow(String institutionId, String id) {
        Announcement announcement = requireOwnAnnouncement(institutionId, id);
        if (Announcement.SENT.equals(announcement.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This announcement has already been sent.");
        }
        announcement.setStatus(Announcement.SENT);
        announcement.setSentAt(Instant.now());
        announcement.setUpdatedAt(Instant.now());
        repository.save(announcement);
        return toResponseOne(institutionId, announcement);
    }

    public void delete(String institutionId, String id) {
        Announcement announcement = requireOwnAnnouncement(institutionId, id);
        attachmentRepository.deleteByAnnouncementId(id);
        repository.delete(announcement);
    }

    private Announcement requireOwnAnnouncement(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found."));
    }

    private void saveAttachments(String announcementId, List<AttachmentRequest> attachments) {
        if (attachments == null) {
            return;
        }
        for (AttachmentRequest attachment : attachments) {
            attachmentRepository.save(new AnnouncementAttachment(
                    "annattach-" + UUID.randomUUID(),
                    announcementId,
                    attachment.fileName(),
                    attachment.fileUrl(),
                    attachment.fileSizeBytes(),
                    Instant.now()));
        }
    }

    private AnnouncementResponse toResponseOne(String institutionId, Announcement announcement) {
        Map<String, String> levelLabelsById = programLevelService.list(institutionId, true).stream()
                .collect(Collectors.toMap(ProgramLevelResponse::id, l -> l.levelCode() + " Level students"));
        Map<String, String> hostelLabelsById = hostelService.list(institutionId).stream()
                .collect(Collectors.toMap(HostelResponse::id, h -> h.name() + " residents"));
        List<AttachmentResponse> attachments = attachmentRepository
                .findByAnnouncementIdOrderByCreatedAtAsc(announcement.getId()).stream()
                .map(AttachmentResponse::from)
                .toList();
        return toResponse(announcement, levelLabelsById, hostelLabelsById, attachments);
    }

    private AnnouncementResponse toResponse(
            Announcement a,
            Map<String, String> levelLabelsById,
            Map<String, String> hostelLabelsById,
            List<AttachmentResponse> attachments) {
        String label = switch (a.getTargetScope()) {
            case SCHOOL_WIDE -> "Entire School";
            case STUDENTS -> "ALL".equals(a.getTargetValue()) || a.getTargetValue() == null
                    ? "All students"
                    : levelLabelsById.getOrDefault(a.getTargetValue(), "Unknown level");
            case STAFF -> "LECTURERS".equals(a.getTargetValue()) ? "Lecturers" : "All staff";
            case HOSTEL_RESIDENTS -> hostelLabelsById.getOrDefault(a.getTargetValue(), "Unknown hostel");
            default -> "";
        };
        return new AnnouncementResponse(
                a.getId(),
                a.getHeadline(),
                a.getBody(),
                a.isSendViaApp(),
                a.isSendViaEmail(),
                a.getTargetScope(),
                a.getTargetValue(),
                label,
                a.getStatus(),
                a.getScheduledFor(),
                a.getSentAt(),
                a.getCreatedByName(),
                attachments == null ? List.of() : attachments,
                a.getCreatedAt(),
                a.getUpdatedAt());
    }

    private void requireValidScope(String scope) {
        if (!SCOPES.contains(scope)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "targetScope must be one of " + SCOPES + ".");
        }
    }

    private void requireValidTargetValue(String institutionId, String scope, String value) {
        switch (scope) {
            case STUDENTS -> {
                if (value != null && !value.isBlank() && !"ALL".equals(value)) {
                    programLevelService.requireOwnProgramLevel(institutionId, value);
                }
            }
            case STAFF -> {
                if (value != null && !value.isBlank() && !STAFF_VALUES.contains(value)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetValue must be ALL or LECTURERS.");
                }
            }
            case HOSTEL_RESIDENTS -> {
                if (value == null || value.isBlank()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "targetValue (a hostel id) is required for HOSTEL_RESIDENTS.");
                }
                hostelService.requireOwnHostel(institutionId, value);
            }
            default -> {
                // SCHOOL_WIDE ignores targetValue entirely.
            }
        }
    }

    private void requireAtLeastOneChannel(boolean sendViaApp, boolean sendViaEmail) {
        if (!sendViaApp && !sendViaEmail) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one channel (App or Email).");
        }
    }

    private void requireValidAction(String action) {
        if (!ACTIONS.contains(action)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "action must be SEND, SCHEDULE, or DRAFT.");
        }
    }

    private String statusFor(String action) {
        return switch (action) {
            case "SEND" -> Announcement.SENT;
            case "SCHEDULE" -> Announcement.SCHEDULED;
            default -> Announcement.DRAFT;
        };
    }

    private Instant resolveScheduledFor(String action, String scheduledFor) {
        if (!"SCHEDULE".equals(action)) {
            return null;
        }
        if (scheduledFor == null || scheduledFor.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "scheduledFor is required to schedule an announcement.");
        }
        try {
            return Instant.parse(scheduledFor);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "scheduledFor must be a valid ISO-8601 instant.");
        }
    }

    private static String normalizeTargetValue(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
