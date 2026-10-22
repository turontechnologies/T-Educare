package com.teducare.lecturer;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.academics.AcademicSemesterResponse;
import com.teducare.academics.AcademicSemesterService;
import com.teducare.academics.AcademicSessionResponse;
import com.teducare.academics.AcademicSessionService;
import com.teducare.course.Course;
import com.teducare.course.CourseResponse;
import com.teducare.course.CourseService;
import com.teducare.department.DepartmentResponse;
import com.teducare.department.DepartmentService;
import com.teducare.programlevel.ProgramLevelResponse;
import com.teducare.programlevel.ProgramLevelService;
import com.teducare.registration.CourseRegistration;
import com.teducare.registration.CourseRegistrationRepository;
import com.teducare.student.StudentResponse;
import com.teducare.student.StudentService;

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
    private final AcademicSemesterService academicSemesterService;
    private final DepartmentService departmentService;
    private final ProgramLevelService programLevelService;
    private final CourseRegistrationRepository courseRegistrationRepository;
    private final StudentService studentService;

    public LectureAssignmentService(
            LectureAssignmentRepository repository,
            TimetableSlotRepository slotRepository,
            TimetableChangeRequestRepository changeRequestRepository,
            LecturerService lecturerService,
            CourseService courseService,
            AcademicSessionService academicSessionService,
            AcademicSemesterService academicSemesterService,
            DepartmentService departmentService,
            ProgramLevelService programLevelService,
            CourseRegistrationRepository courseRegistrationRepository,
            StudentService studentService) {
        this.repository = repository;
        this.slotRepository = slotRepository;
        this.changeRequestRepository = changeRequestRepository;
        this.lecturerService = lecturerService;
        this.departmentService = departmentService;
        this.programLevelService = programLevelService;
        this.courseService = courseService;
        this.academicSessionService = academicSessionService;
        this.academicSemesterService = academicSemesterService;
        this.courseRegistrationRepository = courseRegistrationRepository;
        this.studentService = studentService;
    }

    /**
     * One lecturer's own courses for the institution's current semester,
     * each with the students registered for it — matric number and photo
     * only, deliberately, not the full student record. Empty if no semester
     * is marked current yet, or if this lecturer has no active assignment
     * in the current session. {@link LectureAssignment} is scoped per
     * session (not semester, which doesn't exist at that layer), so the
     * current semester's own {@code sessionId} is what actually selects
     * which assignments count as "current."
     */
    public List<LecturerCourseRoster> myStudentRoster(String institutionId, String lecturerId) {
        AcademicSemesterResponse currentSemester = academicSemesterService.current(institutionId).orElse(null);
        if (currentSemester == null) {
            return List.of();
        }

        List<LectureAssignment> myAssignments = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(a -> a.getArchivedAt() == null
                        && lecturerId.equals(a.getLecturerId())
                        && currentSemester.sessionId().equals(a.getAcademicSessionId()))
                .toList();
        if (myAssignments.isEmpty()) {
            return List.of();
        }

        List<StudentResponse> allStudents = studentService.list(
                institutionId, null, null, null, null, null, null, null, false);
        Map<String, StudentResponse> studentsById = allStudents.stream()
                .collect(Collectors.toMap(StudentResponse::id, s -> s));

        return myAssignments.stream()
                .map(LectureAssignment::getCourseId)
                .distinct()
                .map(courseId -> {
                    Course course = courseService.requireOwnCourse(institutionId, courseId);
                    List<RosterStudent> students = courseRegistrationRepository
                            .findByInstitutionIdAndCourseIdAndAcademicSemesterId(
                                    institutionId, courseId, currentSemester.id())
                            .stream()
                            .map(CourseRegistration::getStudentId)
                            .distinct()
                            .map(studentsById::get)
                            .filter(Objects::nonNull)
                            .map(s -> new RosterStudent(s.id(), s.matricNo(), s.avatarUrl()))
                            .toList();
                    return new LecturerCourseRoster(course.getId(), course.getCode(), course.getName(), students);
                })
                .toList();
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

    // --- CSV import/export (the full institution timetable, optionally scoped to one department) ---

    /** Resolves each row's lecturer (by username), course (by code), and session (by name) — finds-or-creates the assignment, then adds the slot. Skips a row that's missing a field, names something unresolvable, has invalid day/time, or would duplicate a slot already on that assignment. */
    public TimetableImportResult importCsv(String institutionId, String csvText) {
        List<LectureAssignmentCsv.Row> rows = LectureAssignmentCsv.parse(csvText);
        List<LecturerResponse> lecturers = lecturerService.list(institutionId, null, false);
        List<CourseResponse> courses = courseService.list(institutionId, null, null, null, false);
        List<AcademicSessionResponse> sessions = academicSessionService.list(institutionId, false);

        int imported = 0;
        int skipped = 0;

        for (LectureAssignmentCsv.Row row : rows) {
            if (row.lecturerUsername().isEmpty() || row.courseCode().isEmpty() || row.academicSession().isEmpty()
                    || row.dayOfWeek().isEmpty() || row.startTime().isEmpty() || row.endTime().isEmpty()
                    || row.venue().isEmpty()) {
                skipped++;
                continue;
            }

            LecturerResponse lecturer = lecturers.stream()
                    .filter(l -> l.username().equalsIgnoreCase(row.lecturerUsername()))
                    .findFirst().orElse(null);
            CourseResponse course = courses.stream()
                    .filter(c -> c.code().equalsIgnoreCase(row.courseCode()))
                    .findFirst().orElse(null);
            AcademicSessionResponse session = sessions.stream()
                    .filter(s -> s.session().equalsIgnoreCase(row.academicSession()))
                    .findFirst().orElse(null);
            if (lecturer == null || course == null || session == null
                    || !DAYS_OF_WEEK.contains(row.dayOfWeek())
                    || !TIME_PATTERN.matcher(row.startTime()).matches()
                    || !TIME_PATTERN.matcher(row.endTime()).matches()
                    || row.startTime().compareTo(row.endTime()) >= 0) {
                skipped++;
                continue;
            }

            LectureAssignment assignment = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                    .filter(a -> a.getArchivedAt() == null
                            && a.getLecturerId().equals(lecturer.id())
                            && a.getCourseId().equals(course.id())
                            && a.getAcademicSessionId().equals(session.id()))
                    .findFirst()
                    .orElseGet(() -> repository.save(new LectureAssignment(
                            "lectassign-" + UUID.randomUUID(),
                            institutionId,
                            lecturer.id(),
                            course.id(),
                            session.id(),
                            Instant.now(),
                            null)));

            boolean duplicateSlot = slotRepository.findByLectureAssignmentIdOrderByCreatedAtAsc(assignment.getId())
                    .stream()
                    .anyMatch(s -> s.getDayOfWeek().equals(row.dayOfWeek())
                            && s.getStartTime().equals(row.startTime())
                            && s.getEndTime().equals(row.endTime()));
            if (duplicateSlot) {
                skipped++;
                continue;
            }

            slotRepository.save(new TimetableSlot(
                    "slot-" + UUID.randomUUID(),
                    assignment.getId(),
                    row.dayOfWeek(),
                    row.startTime(),
                    row.endTime(),
                    row.venue(),
                    Instant.now()));
            imported++;
        }

        return new TimetableImportResult(imported, skipped);
    }

    /**
     * `departmentId`/`programLevelId` null/blank export everything on that axis; given together, a course must
     * match both to be included — e.g. "Computer Science, 300 Level" pulls only that department's 300L courses,
     * even though the same department also runs 100L-700L courses with their own, different timetables.
     */
    public String exportCsv(String institutionId, String departmentId, String programLevelId) {
        List<LecturerResponse> lecturers = lecturerService.list(institutionId, null, true);
        List<CourseResponse> allCourses = courseService.list(institutionId, null, null, null, true);
        Set<String> allowedCourseIds = allCourses.stream()
                .filter(c -> (departmentId == null || departmentId.isBlank() || departmentId.equals(c.departmentId()))
                        && (programLevelId == null || programLevelId.isBlank()
                                || programLevelId.equals(c.programLevelId())))
                .map(CourseResponse::id)
                .collect(java.util.stream.Collectors.toSet());
        List<AcademicSessionResponse> sessions = academicSessionService.list(institutionId, true);
        List<DepartmentResponse> departments = departmentService.list(institutionId, null, null, true);
        List<ProgramLevelResponse> programLevels = programLevelService.list(institutionId, true);

        List<LectureAssignmentCsv.TimetableExportRow> exportRows = new ArrayList<>();
        for (LectureAssignment assignment : repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId)) {
            if (assignment.getArchivedAt() != null || !allowedCourseIds.contains(assignment.getCourseId())) {
                continue;
            }
            LecturerResponse lecturer = lecturers.stream()
                    .filter(l -> l.id().equals(assignment.getLecturerId())).findFirst().orElse(null);
            CourseResponse course = allCourses.stream()
                    .filter(c -> c.id().equals(assignment.getCourseId())).findFirst().orElse(null);
            AcademicSessionResponse session = sessions.stream()
                    .filter(s -> s.id().equals(assignment.getAcademicSessionId())).findFirst().orElse(null);
            if (lecturer == null || course == null || session == null) {
                continue;
            }
            String departmentName = departments.stream()
                    .filter(d -> d.id().equals(course.departmentId())).findFirst()
                    .map(DepartmentResponse::name).orElse("");
            String levelCode = programLevels.stream()
                    .filter(l -> l.id().equals(course.programLevelId())).findFirst()
                    .map(ProgramLevelResponse::levelCode).orElse("");

            for (TimetableSlot slot : slotRepository.findByLectureAssignmentIdOrderByCreatedAtAsc(assignment.getId())) {
                exportRows.add(new LectureAssignmentCsv.TimetableExportRow(
                        lecturer.username(),
                        lecturer.firstName() + " " + lecturer.lastName(),
                        course.code(),
                        course.name(),
                        levelCode,
                        departmentName,
                        session.session(),
                        slot.getDayOfWeek(),
                        slot.getStartTime(),
                        slot.getEndTime(),
                        slot.getVenue()));
            }
        }
        return LectureAssignmentCsv.write(exportRows);
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
