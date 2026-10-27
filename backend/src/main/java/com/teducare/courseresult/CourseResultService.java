package com.teducare.courseresult;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.academics.AcademicSemester;
import com.teducare.academics.AcademicSemesterService;
import com.teducare.course.CourseResponse;
import com.teducare.course.CourseService;
import com.teducare.coursegrade.CourseGrade;
import com.teducare.coursegrade.CourseGradeRepository;
import com.teducare.department.DepartmentResponse;
import com.teducare.department.DepartmentService;
import com.teducare.lecturer.LectureAssignmentResponse;
import com.teducare.lecturer.LectureAssignmentService;
import com.teducare.lecturer.LecturerResponse;
import com.teducare.lecturer.LecturerService;
import com.teducare.programlevel.ProgramLevelResponse;
import com.teducare.programlevel.ProgramLevelService;
import com.teducare.registration.CourseRegistration;
import com.teducare.registration.CourseRegistrationRepository;
import com.teducare.school.SchoolResponse;
import com.teducare.school.SchoolService;
import com.teducare.student.StudentResponse;
import com.teducare.student.StudentService;

/**
 * Results Management — marking guide, grace period, score entry, and the
 * publish workflow. See {@link CourseResultSubmission}'s own doc comment
 * for the IN_PROGRESS/SUBMITTED/PUBLISHED state machine and how the
 * richer teacher/admin display labels are derived from it, and {@link
 * MarkingGuideComponent}'s for why a component's weight doubles as its
 * max score (so "Overall %" is a plain sum, not a weighted average).
 *
 * <p>Scoping mirrors every other self-service surface in this backend: a
 * caller linked to a Lecturer record ({@code allowedCourseIds}) is scoped
 * to their own assignments plus their whole department's if they're its
 * linked HOD; a pure admin caller is unrestricted.
 */
@Service
public class CourseResultService {

    private static final String PENDING_COMPLETION = "PENDING_COMPLETION";
    private static final String AWAITING_PUBLISHING = "AWAITING_PUBLISHING";
    private static final String PUBLISHED_LABEL = "PUBLISHED";

    private final MarkingGuideRepository markingGuideRepository;
    private final MarkingGuideComponentRepository markingGuideComponentRepository;
    private final ResultsGracePeriodRepository gracePeriodRepository;
    private final CourseResultScoreRepository scoreRepository;
    private final CourseResultSubmissionRepository submissionRepository;
    private final CourseResultEventRepository eventRepository;
    private final CourseService courseService;
    private final CourseGradeRepository courseGradeRepository;
    private final StudentService studentService;
    private final AcademicSemesterService academicSemesterService;
    private final DepartmentService departmentService;
    private final SchoolService schoolService;
    private final ProgramLevelService programLevelService;
    private final LectureAssignmentService lectureAssignmentService;
    private final LecturerService lecturerService;
    private final CourseRegistrationRepository courseRegistrationRepository;

    public CourseResultService(
            MarkingGuideRepository markingGuideRepository,
            MarkingGuideComponentRepository markingGuideComponentRepository,
            ResultsGracePeriodRepository gracePeriodRepository,
            CourseResultScoreRepository scoreRepository,
            CourseResultSubmissionRepository submissionRepository,
            CourseResultEventRepository eventRepository,
            CourseService courseService,
            CourseGradeRepository courseGradeRepository,
            StudentService studentService,
            AcademicSemesterService academicSemesterService,
            DepartmentService departmentService,
            SchoolService schoolService,
            ProgramLevelService programLevelService,
            LectureAssignmentService lectureAssignmentService,
            LecturerService lecturerService,
            CourseRegistrationRepository courseRegistrationRepository) {
        this.markingGuideRepository = markingGuideRepository;
        this.markingGuideComponentRepository = markingGuideComponentRepository;
        this.gracePeriodRepository = gracePeriodRepository;
        this.scoreRepository = scoreRepository;
        this.submissionRepository = submissionRepository;
        this.eventRepository = eventRepository;
        this.courseService = courseService;
        this.courseGradeRepository = courseGradeRepository;
        this.studentService = studentService;
        this.academicSemesterService = academicSemesterService;
        this.departmentService = departmentService;
        this.schoolService = schoolService;
        this.programLevelService = programLevelService;
        this.lectureAssignmentService = lectureAssignmentService;
        this.lecturerService = lecturerService;
        this.courseRegistrationRepository = courseRegistrationRepository;
    }

    // ================= Marking Guide =================

    public MarkingGuideResponse getMarkingGuide(String institutionId) {
        MarkingGuide guide = markingGuideRepository.findByInstitutionId(institutionId).orElse(null);
        String name = guide == null ? "School Marking Guide" : guide.getName();
        List<MarkingGuideComponentResponse> components = componentList(institutionId);
        return new MarkingGuideResponse(name, components, totalWeight(components));
    }

    /** Full replace, matched by component name to preserve ids (and therefore every already-recorded score's link to its component) across an edit — same reuse-by-natural-key convention as {@code HostelService.update}'s rooms. A component no longer present is removed, unless it still has recorded scores (409). */
    public MarkingGuideResponse updateMarkingGuide(String institutionId, UpdateMarkingGuideRequest request) {
        BigDecimal total = request.components().stream()
                .map(MarkingGuideComponentRequest::weight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.compareTo(BigDecimal.valueOf(100)) != 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Component weights must sum to exactly 100 (currently " + total + ").");
        }

        MarkingGuide guide = markingGuideRepository.findByInstitutionId(institutionId)
                .orElse(new MarkingGuide(institutionId, request.name(), Instant.now()));
        guide.setName(request.name());
        guide.setUpdatedAt(Instant.now());
        markingGuideRepository.save(guide);

        List<MarkingGuideComponent> existing = markingGuideComponentRepository
                .findByInstitutionIdOrderByDisplayOrderAsc(institutionId);
        List<String> keptNames = request.components().stream()
                .map(MarkingGuideComponentRequest::name)
                .toList();
        for (MarkingGuideComponent component : existing) {
            if (!keptNames.contains(component.getName())
                    && scoreRepository.existsByInstitutionIdAndComponentId(institutionId, component.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Component \"" + component.getName() + "\" already has recorded scores and can't be removed.");
            }
        }
        for (MarkingGuideComponent component : existing) {
            if (!keptNames.contains(component.getName())) {
                markingGuideComponentRepository.delete(component);
            }
        }

        int order = 0;
        for (MarkingGuideComponentRequest componentRequest : request.components()) {
            MarkingGuideComponent match = existing.stream()
                    .filter(c -> c.getName().equals(componentRequest.name()))
                    .findFirst()
                    .orElse(null);
            if (match != null) {
                markingGuideComponentRepository.save(new MarkingGuideComponent(
                        match.getId(), institutionId, componentRequest.name(), componentRequest.weight(), order++,
                        match.getCreatedAt()));
            } else {
                markingGuideComponentRepository.save(new MarkingGuideComponent(
                        "markingcomp-" + UUID.randomUUID(), institutionId, componentRequest.name(),
                        componentRequest.weight(), order++, Instant.now()));
            }
        }

        return getMarkingGuide(institutionId);
    }

    // ================= Grace Period =================

    public GracePeriodResponse getGracePeriod(String institutionId) {
        return gracePeriodRepository.findByInstitutionId(institutionId)
                .map(g -> new GracePeriodResponse(g.getDeadlineDate().toString(), g.getGracePeriodDays()))
                .orElse(new GracePeriodResponse(null, 0));
    }

    public GracePeriodResponse updateGracePeriod(String institutionId, UpdateGracePeriodRequest request) {
        LocalDate deadline;
        try {
            deadline = LocalDate.parse(request.deadlineDate());
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "deadlineDate must be a valid date (yyyy-MM-dd).");
        }
        ResultsGracePeriod gracePeriod = gracePeriodRepository.findByInstitutionId(institutionId)
                .orElse(new ResultsGracePeriod(institutionId, deadline, request.gracePeriodDays(), Instant.now()));
        gracePeriod.setDeadlineDate(deadline);
        gracePeriod.setGracePeriodDays(request.gracePeriodDays());
        gracePeriod.setUpdatedAt(Instant.now());
        gracePeriodRepository.save(gracePeriod);
        return new GracePeriodResponse(deadline.toString(), request.gracePeriodDays());
    }

    private String deadlineLabel(String institutionId) {
        ResultsGracePeriod gracePeriod = gracePeriodRepository.findByInstitutionId(institutionId).orElse(null);
        if (gracePeriod == null) {
            return null;
        }
        long daysUntil = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), gracePeriod.getDeadlineDate());
        if (daysUntil > 0) {
            return "Deadline in " + daysUntil + " day" + (daysUntil == 1 ? "" : "s");
        }
        long daysPast = -daysUntil;
        if (daysPast <= gracePeriod.getGracePeriodDays()) {
            return "Grace period — " + daysPast + " of " + gracePeriod.getGracePeriodDays() + " days used";
        }
        return "Deadline passed";
    }

    // ================= Scoping =================

    /** Same scoping as every other self-service surface — null means unrestricted (pure admin). */
    public Set<String> allowedCourseIds(String institutionId, String lecturerId) {
        if (lecturerId == null || lecturerId.isBlank()) {
            return null;
        }
        Set<String> allowed = new HashSet<>(
                lectureAssignmentService.list(institutionId, lecturerId, false).stream()
                        .map(LectureAssignmentResponse::courseId)
                        .toList());

        Set<String> hodDepartmentIds = departmentService.list(institutionId, null, null, false).stream()
                .filter(d -> lecturerId.equals(d.hodLecturerId()))
                .map(DepartmentResponse::id)
                .collect(Collectors.toSet());
        if (!hodDepartmentIds.isEmpty()) {
            courseService.list(institutionId, null, null, null, false).stream()
                    .filter(c -> hodDepartmentIds.contains(c.departmentId()))
                    .forEach(c -> allowed.add(c.id()));
        }
        return allowed;
    }

    private void requireCourseInScope(Set<String> allowedCourseIds, String courseId) {
        if (allowedCourseIds != null && !allowedCourseIds.contains(courseId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only manage results for your own courses, or your department's if you're its HOD.");
        }
    }

    // ================= Course list (admin "Courses" / teacher "My Courses") =================

    public List<CourseListItemResponse> listCourses(String institutionId, Set<String> allowedCourseIds, String academicSemesterId) {
        AcademicSemester semester = requireSemester(institutionId, academicSemesterId);
        List<CourseResponse> allCourses = courseService.list(institutionId, null, null, null, false);
        List<CourseResponse> scoped = allowedCourseIds == null
                ? allCourses
                : allCourses.stream().filter(c -> allowedCourseIds.contains(c.id())).toList();
        if (scoped.isEmpty()) {
            return List.of();
        }

        Map<String, DepartmentResponse> departments = departmentLookup(institutionId);
        Map<String, String> schoolNames = schoolLookup(institutionId);
        Map<String, String> lecturerNames = lecturerNameByCourseId(institutionId, semester);
        Map<String, Integer> registeredCountByCourse = registeredCountByCourse(institutionId, semester.getId());
        Map<String, Integer> scoredCountByCourse = scoredCountByCourse(institutionId, semester.getId());
        Map<String, CourseResultSubmission> submissionByCourse = submissionByCourse(institutionId, semester.getId());

        return scoped.stream()
                .map(course -> {
                    DepartmentResponse department = departments.get(course.departmentId());
                    CourseResultSubmission submission = submissionByCourse.get(course.id());
                    return new CourseListItemResponse(
                            course.id(),
                            course.code(),
                            course.name(),
                            department == null ? "—" : department.name(),
                            schoolNames.getOrDefault(course.schoolId(), "—"),
                            lecturerNames.getOrDefault(course.id(), "—"),
                            registeredCountByCourse.getOrDefault(course.id(), 0),
                            scoredCountByCourse.getOrDefault(course.id(), 0),
                            submission == null ? CourseResultSubmission.IN_PROGRESS : submission.getStatus(),
                            semester.getId());
                })
                .sorted(Comparator.comparing(CourseListItemResponse::courseCode))
                .toList();
    }

    // ================= Course Review (admin + teacher read-only) =================

    public CourseReviewResponse review(String institutionId, String courseId, String academicSemesterId, Set<String> allowedCourseIds) {
        AcademicSemester semester = requireSemester(institutionId, academicSemesterId);
        CourseResponse course = courseService.requireOwnCourse(institutionId, courseId);
        requireCourseInScope(allowedCourseIds, courseId);

        List<MarkingGuideComponentResponse> components = componentList(institutionId);
        List<CourseRegistration> registrations =
                courseRegistrationRepository.findByInstitutionIdAndCourseIdAndAcademicSemesterId(
                        institutionId, courseId, semester.getId());
        List<CourseResultScore> scores = scoreRepository.findByInstitutionIdAndCourseIdAndAcademicSemesterId(
                institutionId, courseId, semester.getId());
        Map<String, List<CourseResultScore>> scoresByStudent =
                scores.stream().collect(Collectors.groupingBy(CourseResultScore::getStudentId));
        Map<String, StudentResponse> students = studentLookup(institutionId);
        List<CourseGrade> bands = gradeBands(institutionId);

        List<CourseResultRowResponse> rows = registrations.stream()
                .map(CourseRegistration::getStudentId)
                .distinct()
                .map(studentId -> buildRow(studentId, components, scoresByStudent.get(studentId), students, bands))
                .sorted(Comparator.comparing(CourseResultRowResponse::studentName, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        int scoredCount = (int) rows.stream().filter(r -> r.overall() != null).count();
        CourseResultSubmission submission = submissionRepository
                .findByInstitutionIdAndCourseIdAndAcademicSemesterId(institutionId, courseId, semester.getId())
                .orElse(null);
        DepartmentResponse department = departmentService.list(institutionId, null, null, true).stream()
                .filter(d -> d.id().equals(course.departmentId())).findFirst().orElse(null);
        String levelCode = levelCode(institutionId, course.programLevelId());

        return new CourseReviewResponse(
                course.id(), course.code(), course.name(),
                department == null ? "—" : department.name(),
                schoolLookup(institutionId).getOrDefault(course.schoolId(), "—"),
                levelCode,
                submission == null ? CourseResultSubmission.IN_PROGRESS : submission.getStatus(),
                registrations.stream().map(CourseRegistration::getStudentId).distinct().toList().size(),
                scoredCount,
                semester.getId(),
                components,
                rows);
    }

    // ================= Score entry (teacher) =================

    public MyCourseProgressResponse myCourseProgress(String institutionId, String courseId, String academicSemesterId, Set<String> allowedCourseIds) {
        AcademicSemester semester = requireSemester(institutionId, academicSemesterId);
        CourseResponse course = courseService.requireOwnCourse(institutionId, courseId);
        requireCourseInScope(allowedCourseIds, courseId);

        List<MarkingGuideComponentResponse> components = componentList(institutionId);
        int totalStudents = (int) courseRegistrationRepository
                .findByInstitutionIdAndCourseIdAndAcademicSemesterId(institutionId, courseId, semester.getId())
                .stream().map(CourseRegistration::getStudentId).distinct().count();
        List<CourseResultScore> scores = scoreRepository.findByInstitutionIdAndCourseIdAndAcademicSemesterId(
                institutionId, courseId, semester.getId());

        List<ComponentProgressResponse> componentProgress = components.stream()
                .map(component -> {
                    long scored = scores.stream()
                            .filter(s -> s.getComponentId().equals(component.id()))
                            .map(CourseResultScore::getStudentId)
                            .distinct()
                            .count();
                    String status = scored == 0 ? "NOT_STARTED" : scored >= totalStudents && totalStudents > 0 ? "RECORDED" : "IN_PROGRESS";
                    return new ComponentProgressResponse(component.id(), component.name(), component.weight(), (int) scored, totalStudents, status);
                })
                .toList();

        boolean canSubmit = totalStudents > 0 && !componentProgress.isEmpty()
                && componentProgress.stream().allMatch(c -> "RECORDED".equals(c.status()));

        CourseResultSubmission submission = submissionRepository
                .findByInstitutionIdAndCourseIdAndAcademicSemesterId(institutionId, courseId, semester.getId())
                .orElse(null);
        DepartmentResponse department = departmentService.list(institutionId, null, null, true).stream()
                .filter(d -> d.id().equals(course.departmentId())).findFirst().orElse(null);

        return new MyCourseProgressResponse(
                course.id(), course.code(), course.name(),
                department == null ? "—" : department.name(),
                schoolLookup(institutionId).getOrDefault(course.schoolId(), "—"),
                levelCode(institutionId, course.programLevelId()),
                submission == null ? CourseResultSubmission.IN_PROGRESS : submission.getStatus(),
                deadlineLabel(institutionId),
                totalStudents,
                semester.getId(),
                componentProgress,
                canSubmit);
    }

    public ComponentScoresResponse componentScores(
            String institutionId, String courseId, String componentId, String academicSemesterId, Set<String> allowedCourseIds) {
        AcademicSemester semester = requireSemester(institutionId, academicSemesterId);
        courseService.requireOwnCourse(institutionId, courseId);
        requireCourseInScope(allowedCourseIds, courseId);
        MarkingGuideComponent component = requireOwnComponent(institutionId, componentId);

        List<CourseRegistration> registrations = courseRegistrationRepository
                .findByInstitutionIdAndCourseIdAndAcademicSemesterId(institutionId, courseId, semester.getId());
        Map<String, StudentResponse> students = studentLookup(institutionId);
        Map<String, BigDecimal> existingScores = scoreRepository
                .findByInstitutionIdAndCourseIdAndAcademicSemesterIdAndComponentId(institutionId, courseId, semester.getId(), componentId)
                .stream()
                .collect(Collectors.toMap(CourseResultScore::getStudentId, CourseResultScore::getScore));

        List<StudentScoreCell> cells = registrations.stream()
                .map(CourseRegistration::getStudentId)
                .distinct()
                .map(studentId -> {
                    StudentResponse student = students.get(studentId);
                    return new StudentScoreCell(
                            studentId,
                            student == null ? "—" : student.matricNo(),
                            student == null ? "—" : student.firstName() + " " + student.lastName(),
                            existingScores.get(studentId));
                })
                .sorted(Comparator.comparing(StudentScoreCell::studentName, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        return new ComponentScoresResponse(component.getId(), component.getName(), component.getWeight(), cells);
    }

    public void saveComponentScores(
            String institutionId, String courseId, String componentId, String academicSemesterId,
            SaveComponentScoresRequest request, Set<String> allowedCourseIds) {
        AcademicSemester semester = requireSemester(institutionId, academicSemesterId);
        courseService.requireOwnCourse(institutionId, courseId);
        requireCourseInScope(allowedCourseIds, courseId);
        MarkingGuideComponent component = requireOwnComponent(institutionId, componentId);

        CourseResultSubmission submission = submissionRepository
                .findByInstitutionIdAndCourseIdAndAcademicSemesterId(institutionId, courseId, semester.getId())
                .orElse(null);
        if (submission != null && !CourseResultSubmission.IN_PROGRESS.equals(submission.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This course's results have already been submitted — unpublish or contact an admin to make changes.");
        }

        Instant now = Instant.now();
        for (StudentScoreEntry entry : request.scores()) {
            studentService.requireOwnStudent(institutionId, entry.studentId());
            if (entry.score().compareTo(component.getWeight()) > 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Score for " + entry.studentId() + " exceeds this component's maximum of " + component.getWeight() + ".");
            }
            CourseResultScore existing = scoreRepository
                    .findByInstitutionIdAndStudentIdAndCourseIdAndAcademicSemesterIdAndComponentId(
                            institutionId, entry.studentId(), courseId, semester.getId(), componentId)
                    .orElse(null);
            if (existing != null) {
                existing.setScore(entry.score());
                existing.setUpdatedAt(now);
                scoreRepository.save(existing);
            } else {
                scoreRepository.save(new CourseResultScore(
                        "courseresultscore-" + UUID.randomUUID(), institutionId, entry.studentId(), courseId,
                        semester.getId(), componentId, entry.score(), now, now));
            }
        }

        ensureSubmissionRow(institutionId, courseId, semester.getId());
    }

    public void submit(String institutionId, String courseId, String academicSemesterId, String actorName, Set<String> allowedCourseIds) {
        AcademicSemester semester = requireSemester(institutionId, academicSemesterId);
        courseService.requireOwnCourse(institutionId, courseId);
        requireCourseInScope(allowedCourseIds, courseId);

        MyCourseProgressResponse progress = myCourseProgress(institutionId, courseId, semester.getId(), allowedCourseIds);
        if (!progress.canSubmit()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Record every component for all students before submitting.");
        }

        CourseResultSubmission submission = ensureSubmissionRow(institutionId, courseId, semester.getId());
        submission.setStatus(CourseResultSubmission.SUBMITTED);
        submission.setUpdatedAt(Instant.now());
        submissionRepository.save(submission);

        eventRepository.save(new CourseResultEvent(
                "courseresultevent-" + UUID.randomUUID(), institutionId, courseId, semester.getId(),
                CourseResultEvent.SUBMITTED, actorName, null, Instant.now()));
    }

    // ================= Publish / Unpublish / History (admin) =================

    public void publish(String institutionId, String courseId, String academicSemesterId, String actorName) {
        AcademicSemester semester = requireSemester(institutionId, academicSemesterId);
        courseService.requireOwnCourse(institutionId, courseId);
        CourseResultSubmission submission = submissionRepository
                .findByInstitutionIdAndCourseIdAndAcademicSemesterId(institutionId, courseId, semester.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "This course hasn't been submitted yet."));
        if (!CourseResultSubmission.SUBMITTED.equals(submission.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only a submitted course can be published.");
        }
        submission.setStatus(CourseResultSubmission.PUBLISHED);
        submission.setUpdatedAt(Instant.now());
        submissionRepository.save(submission);
        eventRepository.save(new CourseResultEvent(
                "courseresultevent-" + UUID.randomUUID(), institutionId, courseId, semester.getId(),
                CourseResultEvent.PUBLISHED, actorName, null, Instant.now()));
    }

    public void unpublish(String institutionId, String courseId, String academicSemesterId, String actorName, UnpublishRequest request) {
        AcademicSemester semester = requireSemester(institutionId, academicSemesterId);
        courseService.requireOwnCourse(institutionId, courseId);
        CourseResultSubmission submission = submissionRepository
                .findByInstitutionIdAndCourseIdAndAcademicSemesterId(institutionId, courseId, semester.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "This course isn't published."));
        if (!CourseResultSubmission.PUBLISHED.equals(submission.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only a published course can be unpublished.");
        }
        submission.setStatus(CourseResultSubmission.SUBMITTED);
        submission.setUpdatedAt(Instant.now());
        submissionRepository.save(submission);
        eventRepository.save(new CourseResultEvent(
                "courseresultevent-" + UUID.randomUUID(), institutionId, courseId, semester.getId(),
                CourseResultEvent.UNPUBLISHED, actorName, request.reason(), Instant.now()));
    }

    public List<CourseResultEventResponse> history(String institutionId, String courseId, String academicSemesterId) {
        AcademicSemester semester = requireSemester(institutionId, academicSemesterId);
        courseService.requireOwnCourse(institutionId, courseId);
        return eventRepository
                .findByInstitutionIdAndCourseIdAndAcademicSemesterIdOrderByCreatedAtDesc(institutionId, courseId, semester.getId())
                .stream()
                .map(CourseResultEventResponse::from)
                .toList();
    }

    // ================= Programs (admin, department x level groups) =================

    public List<DepartmentGroupResponse> listDepartmentGroups(String institutionId, String academicSemesterId) {
        AcademicSemester semester = requireSemester(institutionId, academicSemesterId);
        List<CourseResponse> courses = courseService.list(institutionId, null, null, null, false);
        if (courses.isEmpty()) {
            return List.of();
        }
        Map<String, DepartmentResponse> departments = departmentLookup(institutionId);
        Map<String, String> schoolNames = schoolLookup(institutionId);
        Map<String, String> levelCodes = levelCodeLookup(institutionId);
        Map<String, CourseResultSubmission> submissionByCourse = submissionByCourse(institutionId, semester.getId());

        Map<String, List<CourseResponse>> grouped = courses.stream()
                .collect(Collectors.groupingBy(c -> c.departmentId() + "::" + c.programLevelId()));

        return grouped.entrySet().stream()
                .map(entry -> {
                    List<CourseResponse> groupCourses = entry.getValue();
                    CourseResponse sample = groupCourses.get(0);
                    DepartmentResponse department = departments.get(sample.departmentId());
                    int total = groupCourses.size();
                    int submitted = (int) groupCourses.stream()
                            .map(c -> submissionByCourse.get(c.id()))
                            .filter(s -> s != null && (CourseResultSubmission.SUBMITTED.equals(s.getStatus())
                                    || CourseResultSubmission.PUBLISHED.equals(s.getStatus())))
                            .count();
                    int published = (int) groupCourses.stream()
                            .map(c -> submissionByCourse.get(c.id()))
                            .filter(s -> s != null && CourseResultSubmission.PUBLISHED.equals(s.getStatus()))
                            .count();
                    String status = published == total ? PUBLISHED_LABEL : submitted == total ? AWAITING_PUBLISHING : PENDING_COMPLETION;
                    return new DepartmentGroupResponse(
                            sample.departmentId(),
                            department == null ? "—" : department.name(),
                            department == null ? "—" : schoolNames.getOrDefault(department.schoolId(), "—"),
                            sample.programLevelId(),
                            levelCodes.getOrDefault(sample.programLevelId(), "—"),
                            total, submitted, status, semester.getId());
                })
                .sorted(Comparator.comparing(DepartmentGroupResponse::departmentName)
                        .thenComparing(DepartmentGroupResponse::levelCode, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    public DepartmentGroupDetailResponse departmentGroupDetail(
            String institutionId, String departmentId, String programLevelId, String academicSemesterId) {
        AcademicSemester semester = requireSemester(institutionId, academicSemesterId);
        List<CourseResponse> groupCourses = courseService.list(institutionId, departmentId, null, null, false).stream()
                .filter(c -> programLevelId.equals(c.programLevelId()))
                .toList();
        if (groupCourses.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No courses found for this department and level.");
        }

        DepartmentResponse department = departmentService.list(institutionId, null, null, true).stream()
                .filter(d -> d.id().equals(departmentId)).findFirst().orElse(null);
        Map<String, String> schoolNames = schoolLookup(institutionId);
        String levelCode = levelCode(institutionId, programLevelId);
        Map<String, CourseResultSubmission> submissionByCourse = submissionByCourse(institutionId, semester.getId());

        List<DepartmentCourseColumn> columns = groupCourses.stream()
                .sorted(Comparator.comparing(CourseResponse::code))
                .map(c -> new DepartmentCourseColumn(c.id(), c.code()))
                .toList();

        List<String> courseIds = groupCourses.stream().map(CourseResponse::id).toList();
        Set<String> studentIds = new HashSet<>();
        Map<String, Map<String, List<CourseResultScore>>> scoresByCourseThenStudent = new java.util.HashMap<>();
        for (CourseResponse course : groupCourses) {
            List<CourseResultScore> scores = scoreRepository.findByInstitutionIdAndCourseIdAndAcademicSemesterId(
                    institutionId, course.id(), semester.getId());
            scoresByCourseThenStudent.put(course.id(), scores.stream().collect(Collectors.groupingBy(CourseResultScore::getStudentId)));
            courseRegistrationRepository.findByInstitutionIdAndCourseIdAndAcademicSemesterId(institutionId, course.id(), semester.getId())
                    .forEach(r -> studentIds.add(r.getStudentId()));
        }

        List<MarkingGuideComponentResponse> components = componentList(institutionId);
        Map<String, StudentResponse> students = studentLookup(institutionId);
        List<CourseGrade> bands = gradeBands(institutionId);

        List<DepartmentStudentRow> rows = studentIds.stream()
                .map(studentId -> buildDepartmentRow(institutionId, studentId, groupCourses, scoresByCourseThenStudent, components, students, bands, semester.getId()))
                .sorted(Comparator.comparing(DepartmentStudentRow::studentName, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        int submitted = (int) courseIds.stream()
                .map(submissionByCourse::get)
                .filter(s -> s != null && (CourseResultSubmission.SUBMITTED.equals(s.getStatus()) || CourseResultSubmission.PUBLISHED.equals(s.getStatus())))
                .count();
        int published = (int) courseIds.stream()
                .map(submissionByCourse::get)
                .filter(s -> s != null && CourseResultSubmission.PUBLISHED.equals(s.getStatus()))
                .count();
        String status = published == groupCourses.size() ? PUBLISHED_LABEL
                : submitted == groupCourses.size() ? AWAITING_PUBLISHING : PENDING_COMPLETION;

        return new DepartmentGroupDetailResponse(
                department == null ? "—" : department.name(),
                department == null ? "—" : schoolNames.getOrDefault(department.schoolId(), "—"),
                levelCode, groupCourses.size(), submitted, status, semester.getId(), columns, rows);
    }

    // ================= GPA / CGPA =================

    public GpaResponse gpa(String institutionId, String studentId, String academicSemesterId) {
        studentService.requireOwnStudent(institutionId, studentId);
        return computeGpaForSemester(institutionId, studentId, academicSemesterId);
    }

    public CgpaResponse cgpa(String institutionId, String studentId) {
        studentService.requireOwnStudent(institutionId, studentId);
        List<CourseResultScore> allScores = scoreRepository.findByInstitutionIdAndStudentIdOrderByCreatedAtAsc(institutionId, studentId);
        List<String> semesterIds = allScores.stream().map(CourseResultScore::getAcademicSemesterId).distinct().toList();

        List<GpaResponse> bySemester = semesterIds.stream()
                .map(semesterId -> computeGpaForSemester(institutionId, studentId, semesterId))
                .toList();

        BigDecimal weightedPoints = BigDecimal.ZERO;
        int totalUnits = 0;
        int courseCount = 0;
        for (GpaResponse semesterGpa : bySemester) {
            if (semesterGpa.gpa() != null) {
                weightedPoints = weightedPoints.add(BigDecimal.valueOf(semesterGpa.gpa()).multiply(BigDecimal.valueOf(semesterGpa.totalUnits())));
                totalUnits += semesterGpa.totalUnits();
                courseCount += semesterGpa.courseCount();
            }
        }
        Double overall = totalUnits == 0 ? null
                : weightedPoints.divide(BigDecimal.valueOf(totalUnits), 2, RoundingMode.HALF_UP).doubleValue();
        return new CgpaResponse(overall, totalUnits, courseCount, bySemester);
    }

    private GpaResponse computeGpaForSemester(String institutionId, String studentId, String academicSemesterId) {
        List<CourseResultScore> semesterScores = scoreRepository
                .findByInstitutionIdAndStudentIdAndAcademicSemesterId(institutionId, studentId, academicSemesterId);
        Map<String, List<CourseResultScore>> byCourse = semesterScores.stream()
                .collect(Collectors.groupingBy(CourseResultScore::getCourseId));
        Map<String, CourseResponse> courses = courseLookup(institutionId);
        List<CourseGrade> bands = gradeBands(institutionId);
        int totalComponents = componentList(institutionId).size();

        BigDecimal weightedPoints = BigDecimal.ZERO;
        int totalUnits = 0;
        int counted = 0;
        for (Map.Entry<String, List<CourseResultScore>> entry : byCourse.entrySet()) {
            if (entry.getValue().size() < totalComponents || totalComponents == 0) {
                continue;
            }
            CourseResponse course = courses.get(entry.getKey());
            if (course == null) {
                continue;
            }
            BigDecimal overall = entry.getValue().stream().map(CourseResultScore::getScore).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal gradePoint = gradePointFor(bands, overall);
            if (gradePoint == null) {
                continue;
            }
            weightedPoints = weightedPoints.add(gradePoint.multiply(BigDecimal.valueOf(course.unit())));
            totalUnits += course.unit();
            counted++;
        }
        if (totalUnits == 0) {
            return new GpaResponse(academicSemesterId, null, 0, 0);
        }
        double gpaValue = weightedPoints.divide(BigDecimal.valueOf(totalUnits), 2, RoundingMode.HALF_UP).doubleValue();
        return new GpaResponse(academicSemesterId, gpaValue, totalUnits, counted);
    }

    // ================= Shared helpers =================

    private CourseResultRowResponse buildRow(
            String studentId, List<MarkingGuideComponentResponse> components, List<CourseResultScore> studentScores,
            Map<String, StudentResponse> students, List<CourseGrade> bands) {
        StudentResponse student = students.get(studentId);
        Map<String, BigDecimal> scoreByComponent = studentScores == null ? Map.of()
                : studentScores.stream().collect(Collectors.toMap(CourseResultScore::getComponentId, CourseResultScore::getScore));

        List<ComponentScoreCell> cells = components.stream()
                .map(c -> new ComponentScoreCell(c.id(), c.name(), c.weight(), scoreByComponent.get(c.id())))
                .toList();

        boolean complete = !components.isEmpty() && cells.stream().allMatch(c -> c.score() != null);
        BigDecimal overall = complete
                ? cells.stream().map(ComponentScoreCell::score).reduce(BigDecimal.ZERO, BigDecimal::add)
                : null;
        CourseGrade band = overall == null ? null : bandFor(bands, overall);

        return new CourseResultRowResponse(
                studentId,
                student == null ? "—" : (student.matricNo() != null ? student.matricNo() : student.preAdmissionId()),
                student == null ? "—" : student.firstName() + " " + student.lastName(),
                cells, overall,
                band == null ? null : band.getCode(),
                band == null ? null : band.getRemark(),
                band == null ? null : band.getGradeScore());
    }

    private DepartmentStudentRow buildDepartmentRow(
            String institutionId, String studentId, List<CourseResponse> groupCourses,
            Map<String, Map<String, List<CourseResultScore>>> scoresByCourseThenStudent,
            List<MarkingGuideComponentResponse> components, Map<String, StudentResponse> students,
            List<CourseGrade> bands, String academicSemesterId) {
        StudentResponse student = students.get(studentId);
        List<PerCourseCell> perCourse = new ArrayList<>();
        List<BigDecimal> overallScores = new ArrayList<>();

        for (CourseResponse course : groupCourses) {
            List<CourseResultScore> studentScores = scoresByCourseThenStudent
                    .getOrDefault(course.id(), Map.of())
                    .get(studentId);
            boolean complete = studentScores != null && studentScores.size() == components.size() && !components.isEmpty();
            if (complete) {
                BigDecimal overall = studentScores.stream().map(CourseResultScore::getScore).reduce(BigDecimal.ZERO, BigDecimal::add);
                CourseGrade band = bandFor(bands, overall);
                perCourse.add(new PerCourseCell(course.id(), overall, band == null ? null : band.getCode()));
                overallScores.add(overall);
            } else {
                perCourse.add(new PerCourseCell(course.id(), null, null));
            }
        }

        Double overallPercent = overallScores.isEmpty() ? null
                : overallScores.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(overallScores.size()), 2, RoundingMode.HALF_UP).doubleValue();
        CourseGrade overallBand = overallPercent == null ? null : bandFor(bands, BigDecimal.valueOf(overallPercent));

        GpaResponse semesterGpa = computeGpaForSemester(institutionId, studentId, academicSemesterId);
        CgpaResponse cumulative = cgpa(institutionId, studentId);

        return new DepartmentStudentRow(
                studentId,
                student == null ? "—" : (student.matricNo() != null ? student.matricNo() : student.preAdmissionId()),
                student == null ? "—" : student.firstName() + " " + student.lastName(),
                perCourse, overallPercent,
                overallBand == null ? null : overallBand.getCode(),
                semesterGpa.gpa(), cumulative.cgpa());
    }

    private CourseResultSubmission ensureSubmissionRow(String institutionId, String courseId, String academicSemesterId) {
        return submissionRepository.findByInstitutionIdAndCourseIdAndAcademicSemesterId(institutionId, courseId, academicSemesterId)
                .orElseGet(() -> submissionRepository.save(new CourseResultSubmission(
                        "courseresultsub-" + UUID.randomUUID(), institutionId, courseId, academicSemesterId,
                        CourseResultSubmission.IN_PROGRESS, Instant.now(), Instant.now())));
    }

    private AcademicSemester requireSemester(String institutionId, String academicSemesterId) {
        if (academicSemesterId == null || academicSemesterId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "academicSemesterId is required.");
        }
        return academicSemesterService.requireOwnSemester(institutionId, academicSemesterId);
    }

    private MarkingGuideComponent requireOwnComponent(String institutionId, String componentId) {
        return markingGuideComponentRepository.findByInstitutionIdOrderByDisplayOrderAsc(institutionId).stream()
                .filter(c -> c.getId().equals(componentId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Marking guide component not found."));
    }

    private List<MarkingGuideComponentResponse> componentList(String institutionId) {
        return markingGuideComponentRepository.findByInstitutionIdOrderByDisplayOrderAsc(institutionId).stream()
                .map(MarkingGuideComponentResponse::from)
                .toList();
    }

    private static BigDecimal totalWeight(List<MarkingGuideComponentResponse> components) {
        return components.stream().map(MarkingGuideComponentResponse::weight).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal gradePointFor(List<CourseGrade> bands, BigDecimal score) {
        CourseGrade band = bandFor(bands, score);
        return band == null ? null : band.getGradeScore();
    }

    private static CourseGrade bandFor(List<CourseGrade> bands, BigDecimal score) {
        return bands.stream()
                .filter(band -> band.getArchivedAt() == null)
                .filter(band -> score.compareTo(band.getMinimumScore()) >= 0 && score.compareTo(band.getMaximumScore()) <= 0)
                .findFirst()
                .orElse(null);
    }

    private List<CourseGrade> gradeBands(String institutionId) {
        return courseGradeRepository.findByInstitutionIdOrderByCreatedAtAsc(institutionId);
    }

    private Map<String, CourseResponse> courseLookup(String institutionId) {
        return courseService.list(institutionId, null, null, null, true).stream()
                .collect(Collectors.toMap(CourseResponse::id, c -> c));
    }

    private Map<String, StudentResponse> studentLookup(String institutionId) {
        return studentService.list(institutionId, null, null, null, null, null, null, null, true).stream()
                .collect(Collectors.toMap(StudentResponse::id, s -> s));
    }

    private Map<String, DepartmentResponse> departmentLookup(String institutionId) {
        return departmentService.list(institutionId, null, null, true).stream()
                .collect(Collectors.toMap(DepartmentResponse::id, d -> d));
    }

    private Map<String, String> schoolLookup(String institutionId) {
        return schoolService.list(institutionId, true).stream()
                .collect(Collectors.toMap(SchoolResponse::id, SchoolResponse::name));
    }

    private Map<String, String> levelCodeLookup(String institutionId) {
        return programLevelService.list(institutionId, true).stream()
                .collect(Collectors.toMap(ProgramLevelResponse::id, ProgramLevelResponse::levelCode));
    }

    private String levelCode(String institutionId, String programLevelId) {
        return levelCodeLookup(institutionId).getOrDefault(programLevelId, "—");
    }

    /** One lecturer name per course, for the current semester's session — the first real assignment found when a course has more than one lecturer. */
    private Map<String, String> lecturerNameByCourseId(String institutionId, AcademicSemester semester) {
        String sessionId = semester.getSessionId();
        Map<String, LecturerResponse> lecturers = lecturerService.list(institutionId, null, true).stream()
                .collect(Collectors.toMap(LecturerResponse::id, l -> l));
        Map<String, String> result = new java.util.HashMap<>();
        for (LectureAssignmentResponse assignment : lectureAssignmentService.list(institutionId, null, false)) {
            if (!sessionId.equals(assignment.academicSessionId()) || result.containsKey(assignment.courseId())) {
                continue;
            }
            LecturerResponse lecturer = lecturers.get(assignment.lecturerId());
            if (lecturer != null) {
                result.put(assignment.courseId(), lecturer.firstName() + " " + lecturer.lastName());
            }
        }
        return result;
    }

    private Map<String, Integer> registeredCountByCourse(String institutionId, String academicSemesterId) {
        List<CourseResponse> courses = courseService.list(institutionId, null, null, null, false);
        Map<String, Integer> result = new java.util.HashMap<>();
        for (CourseResponse course : courses) {
            int count = (int) courseRegistrationRepository
                    .findByInstitutionIdAndCourseIdAndAcademicSemesterId(institutionId, course.id(), academicSemesterId)
                    .stream().map(CourseRegistration::getStudentId).distinct().count();
            result.put(course.id(), count);
        }
        return result;
    }

    /** Batched — one query for every score in the semester, grouped by course and then by "every component present for that student" in memory, instead of a query per course. */
    private Map<String, Integer> scoredCountByCourse(String institutionId, String academicSemesterId) {
        int totalComponents = componentList(institutionId).size();
        if (totalComponents == 0) {
            return Map.of();
        }
        List<CourseResultScore> allScores = scoreRepository.findByInstitutionIdAndAcademicSemesterId(institutionId, academicSemesterId);
        Map<String, Map<String, Long>> componentsScoredByCourseThenStudent = allScores.stream()
                .collect(Collectors.groupingBy(
                        CourseResultScore::getCourseId,
                        Collectors.groupingBy(CourseResultScore::getStudentId, Collectors.counting())));
        Map<String, Integer> result = new java.util.HashMap<>();
        componentsScoredByCourseThenStudent.forEach((courseId, byStudent) -> {
            long fullyScored = byStudent.values().stream().filter(count -> count >= totalComponents).count();
            result.put(courseId, (int) fullyScored);
        });
        return result;
    }

    private Map<String, CourseResultSubmission> submissionByCourse(String institutionId, String academicSemesterId) {
        return submissionRepository.findByInstitutionIdAndAcademicSemesterId(institutionId, academicSemesterId).stream()
                .collect(Collectors.toMap(CourseResultSubmission::getCourseId, s -> s));
    }
}
