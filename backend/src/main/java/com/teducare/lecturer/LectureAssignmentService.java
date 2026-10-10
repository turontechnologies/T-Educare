package com.teducare.lecturer;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.academics.AcademicSessionService;
import com.teducare.course.CourseService;

/**
 * "Lectures" (which {@link Lecturer} teaches which Course) and their weekly
 * {@link TimetableSlot}s, plus the lecturer-initiated reschedule-request
 * workflow — kept in one service since a slot/request never makes sense
 * outside the assignment that owns it (same "sub-resource lives in its
 * parent's service" convention as Staff's qualifications/disciplinary
 * records).
 */
@Service
public class LectureAssignmentService {

    private static final Set<String> DAYS_OF_WEEK = Set.of(
            "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY");
    private static final Pattern TIME_PATTERN = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");

    private final LectureAssignmentRepository repository;
    private final TimetableSlotRepository slotRepository;
    private final TimetableChangeRequestRepository changeRequestRepository;
    private final LecturerService lecturerService;
    private final CourseService courseService;
    private final AcademicSessionService academicSessionService;

    public LectureAssignmentService(
            LectureAssignmentRepository repository,
            TimetableSlotRepository slotRepository,
            TimetableChangeRequestRepository changeRequestRepository,
            LecturerService lecturerService,
            CourseService courseService,
            AcademicSessionService academicSessionService) {
        this.repository = repository;
        this.slotRepository = slotRepository;
        this.changeRequestRepository = changeRequestRepository;
        this.lecturerService = lecturerService;
        this.courseService = courseService;
        this.academicSessionService = academicSessionService;
    }

    public List<LectureAssignmentResponse> list(String institutionId, String lecturerId, boolean includeArchived) {
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(a -> includeArchived || a.getArchivedAt() == null)
                .filter(a -> lecturerId == null || lecturerId.isBlank() || lecturerId.equals(a.getLecturerId()))
                .map(a -> LectureAssignmentResponse.from(a, listSlots(a.getId())))
                .toList();
    }

    public LectureAssignmentResponse create(String institutionId, CreateLectureAssignmentRequest request) {
        lecturerService.requireOwnLecturer(institutionId, request.lecturerId());
        courseService.requireOwnCourse(institutionId, request.courseId());
        academicSessionService.requireOwnSession(institutionId, request.academicSessionId());

        boolean duplicate = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .anyMatch(a -> a.getArchivedAt() == null
                        && a.getLecturerId().equals(request.lecturerId())
                        && a.getCourseId().equals(request.courseId())
                        && a.getAcademicSessionId().equals(request.academicSessionId()));
        if (duplicate) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This lecturer is already assigned to that course for that session.");
        }

        LectureAssignment assignment = new LectureAssignment(
                "lectassign-" + UUID.randomUUID(),
                institutionId,
                request.lecturerId(),
                request.courseId(),
                request.academicSessionId(),
                Instant.now(),
                null);
        return LectureAssignmentResponse.from(repository.save(assignment), List.of());
    }

    public LectureAssignmentResponse archive(String institutionId, String id) {
        LectureAssignment assignment = requireOwnAssignment(institutionId, id);
        assignment.setArchivedAt(Instant.now());
        return LectureAssignmentResponse.from(repository.save(assignment), listSlots(id));
    }

    public LectureAssignmentResponse restore(String institutionId, String id) {
        LectureAssignment assignment = requireOwnAssignment(institutionId, id);
        assignment.setArchivedAt(null);
        return LectureAssignmentResponse.from(repository.save(assignment), listSlots(id));
    }

    public TimetableSlotResponse addSlot(String institutionId, String assignmentId, CreateTimetableSlotRequest request) {
        requireOwnAssignment(institutionId, assignmentId);
        validateDayOfWeek(request.dayOfWeek());
        validateTime(request.startTime(), "startTime");
        validateTime(request.endTime(), "endTime");
        if (request.startTime().compareTo(request.endTime()) >= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time must be before end time.");
        }

        TimetableSlot slot = new TimetableSlot(
                "slot-" + UUID.randomUUID(),
                assignmentId,
                request.dayOfWeek(),
                request.startTime(),
                request.endTime(),
                request.venue(),
                Instant.now());
        return TimetableSlotResponse.from(slotRepository.save(slot));
    }

    public void deleteSlot(String institutionId, String assignmentId, String slotId) {
        requireOwnAssignment(institutionId, assignmentId);
        TimetableSlot slot = slotRepository.findByIdAndLectureAssignmentId(slotId, assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Timetable slot not found."));
        slotRepository.delete(slot);
    }

    private List<TimetableSlotResponse> listSlots(String assignmentId) {
        return slotRepository.findByLectureAssignmentIdOrderByCreatedAtAsc(assignmentId).stream()
                .map(TimetableSlotResponse::from)
                .toList();
    }

    // --- Reschedule requests ---

    public TimetableChangeRequestResponse requestChange(
            String institutionId, String callerLecturerId, RequestTimetableChangeRequest request) {
        LectureAssignment owning = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(a -> slotRepository.findByIdAndLectureAssignmentId(request.timetableSlotId(), a.getId()).isPresent())
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Timetable slot not found."));
        if (!owning.getLecturerId().equals(callerLecturerId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You can only request a change to your own timetable slots.");
        }

        validateDayOfWeek(request.proposedDayOfWeek());
        validateTime(request.proposedStartTime(), "proposedStartTime");
        validateTime(request.proposedEndTime(), "proposedEndTime");
        if (request.proposedStartTime().compareTo(request.proposedEndTime()) >= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time must be before end time.");
        }

        TimetableChangeRequest changeRequest = new TimetableChangeRequest(
                "ttchange-" + UUID.randomUUID(),
                institutionId,
                request.timetableSlotId(),
                callerLecturerId,
                request.proposedDayOfWeek(),
                request.proposedStartTime(),
                request.proposedEndTime(),
                request.proposedVenue(),
                request.reason(),
                "PENDING",
                Instant.now(),
                null);
        return TimetableChangeRequestResponse.from(changeRequestRepository.save(changeRequest));
    }

    public List<TimetableChangeRequestResponse> listChangeRequests(String institutionId) {
        return changeRequestRepository.findByInstitutionIdOrderByCreatedAtDesc(institutionId).stream()
                .map(TimetableChangeRequestResponse::from)
                .toList();
    }

    public List<TimetableChangeRequestResponse> listChangeRequestsForLecturer(String institutionId, String lecturerId) {
        return changeRequestRepository.findByInstitutionIdOrderByCreatedAtDesc(institutionId).stream()
                .filter(r -> r.getRequestedByLecturerId().equals(lecturerId))
                .map(TimetableChangeRequestResponse::from)
                .toList();
    }

    /** Approving edits the real slot in place; rejecting just marks the request resolved. Either way the request itself is kept as history, never deleted. */
    public TimetableChangeRequestResponse resolveChangeRequest(String institutionId, String id, boolean approve) {
        TimetableChangeRequest request = changeRequestRepository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Change request not found."));
        if (!"PENDING".equals(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This request has already been resolved.");
        }

        if (approve) {
            TimetableSlot slot = slotRepository.findById(request.getTimetableSlotId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Timetable slot not found."));
            slot.setDayOfWeek(request.getProposedDayOfWeek());
            slot.setStartTime(request.getProposedStartTime());
            slot.setEndTime(request.getProposedEndTime());
            if (request.getProposedVenue() != null && !request.getProposedVenue().isBlank()) {
                slot.setVenue(request.getProposedVenue());
            }
            slotRepository.save(slot);
        }

        request.setStatus(approve ? "APPROVED" : "REJECTED");
        request.setResolvedAt(Instant.now());
        return TimetableChangeRequestResponse.from(changeRequestRepository.save(request));
    }

    private LectureAssignment requireOwnAssignment(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecture assignment not found."));
    }

    private static void validateDayOfWeek(String value) {
        if (!DAYS_OF_WEEK.contains(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid day of week: " + value);
        }
    }

    private static void validateTime(String value, String field) {
        if (!TIME_PATTERN.matcher(value).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be in HH:mm (24-hour) format.");
        }
    }
}
