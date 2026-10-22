package com.teducare.courseresult;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.academics.AcademicSemesterService;
import com.teducare.course.CourseResponse;
import com.teducare.course.CourseService;
import com.teducare.coursegrade.CourseGrade;
import com.teducare.coursegrade.CourseGradeRepository;
import com.teducare.department.DepartmentResponse;
import com.teducare.department.DepartmentService;
import com.teducare.lecturer.LectureAssignmentResponse;
import com.teducare.lecturer.LectureAssignmentService;
import com.teducare.student.StudentService;

/**
 * Score entry (one score per student per course per semester) plus
 * GPA/CGPA computed live from it — never stored, same "never denormalize
 * something computable" rule as Leave balances and Attendance's daily
 * status (see {@link CourseResult}'s own doc comment for why that matters
 * here specifically: a grade-band edit must retroactively reclassify
 * every existing result). Deliberately minimal — no approval/publish
 * workflow, no deadlines/penalties; this is the score-entry-and-GPA
 * foundation only, by explicit scope.
 */
@Service
public class CourseResultService {

    private final CourseResultRepository repository;
    private final CourseService courseService;
    private final CourseGradeRepository courseGradeRepository;
    private final StudentService studentService;
    private final AcademicSemesterService academicSemesterService;
    private final DepartmentService departmentService;
    private final LectureAssignmentService lectureAssignmentService;

    public CourseResultService(
            CourseResultRepository repository,
            CourseService courseService,
            CourseGradeRepository courseGradeRepository,
            StudentService studentService,
            AcademicSemesterService academicSemesterService,
            DepartmentService departmentService,
            LectureAssignmentService lectureAssignmentService) {
        this.repository = repository;
        this.courseService = courseService;
        this.courseGradeRepository = courseGradeRepository;
        this.studentService = studentService;
        this.academicSemesterService = academicSemesterService;
        this.departmentService = departmentService;
        this.lectureAssignmentService = lectureAssignmentService;
    }

    /**
     * Every course a caller may manage results for. Null means unrestricted
     * (a pure admin/registrar caller, no {@code lecturerId} on their
     * session) — present means a lecturer self-service caller, scoped to
     * the courses they're personally assigned to teach, plus — if they're
     * linked as the HOD of one or more departments ({@code
     * Department.hodLecturerId}) — every course in those departments too,
     * not just their own.
     */
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
                    HttpStatus.FORBIDDEN, "You can only manage results for your own courses, or your department's if you're its HOD.");
        }
    }

    public List<CourseResultResponse> listForStudentSemester(
            String institutionId, String studentId, String academicSemesterId) {
        studentService.requireOwnStudent(institutionId, studentId);
        return enrich(institutionId,
                repository.findByInstitutionIdAndStudentIdAndAcademicSemesterId(institutionId, studentId, academicSemesterId));
    }

    public List<CourseResultResponse> listForCourseSemester(
            String institutionId, String courseId, String academicSemesterId, Set<String> allowedCourseIds) {
        courseService.requireOwnCourse(institutionId, courseId);
        requireCourseInScope(allowedCourseIds, courseId);
        return enrich(institutionId,
                repository.findByInstitutionIdAndCourseIdAndAcademicSemesterId(institutionId, courseId, academicSemesterId));
    }

    public CourseResultResponse create(
            String institutionId, CreateCourseResultRequest request, Set<String> allowedCourseIds) {
        requireCourseInScope(allowedCourseIds, request.courseId());
        studentService.requireOwnStudent(institutionId, request.studentId());
        courseService.requireOwnCourse(institutionId, request.courseId());
        academicSemesterService.requireOwnSemester(institutionId, request.academicSemesterId());

        boolean duplicate = repository
                .findByInstitutionIdAndStudentIdAndCourseIdAndAcademicSemesterId(
                        institutionId, request.studentId(), request.courseId(), request.academicSemesterId())
                .isPresent();
        if (duplicate) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "A result already exists for this student, course, and semester — edit it instead.");
        }

        Instant now = Instant.now();
        CourseResult result = new CourseResult(
                "courseresult-" + UUID.randomUUID(),
                institutionId,
                request.studentId(),
                request.courseId(),
                request.academicSemesterId(),
                request.score(),
                now,
                now);
        repository.save(result);
        return enrichOne(result, courseLookup(institutionId), gradeBands(institutionId));
    }

    public CourseResultResponse update(
            String institutionId, String id, UpdateCourseResultRequest request, Set<String> allowedCourseIds) {
        CourseResult result = requireOwnResult(institutionId, id);
        requireCourseInScope(allowedCourseIds, result.getCourseId());
        result.setScore(request.score());
        result.setUpdatedAt(Instant.now());
        repository.save(result);
        return enrichOne(result, courseLookup(institutionId), gradeBands(institutionId));
    }

    /** The courses a lecturer self-service caller may pick from — their own assignments plus their HOD department's, if any. */
    public List<CourseResponse> myCourses(String institutionId, String lecturerId) {
        Set<String> allowed = allowedCourseIds(institutionId, lecturerId);
        if (allowed == null || allowed.isEmpty()) {
            return List.of();
        }
        return courseService.list(institutionId, null, null, null, false).stream()
                .filter(c -> allowed.contains(c.id()))
                .toList();
    }

    public void delete(String institutionId, String id) {
        repository.delete(requireOwnResult(institutionId, id));
    }

    public GpaResponse gpa(String institutionId, String studentId, String academicSemesterId) {
        studentService.requireOwnStudent(institutionId, studentId);
        List<CourseResult> results =
                repository.findByInstitutionIdAndStudentIdAndAcademicSemesterId(institutionId, studentId, academicSemesterId);
        return computeGpa(academicSemesterId, results, courseLookup(institutionId), gradeBands(institutionId));
    }

    /** The student's CGPA across every semester they have results for, plus the same breakdown per semester — one batched pass over all their results, not one query per semester. */
    public CgpaResponse cgpa(String institutionId, String studentId) {
        studentService.requireOwnStudent(institutionId, studentId);
        List<CourseResult> allResults =
                repository.findByInstitutionIdAndStudentIdOrderByCreatedAtAsc(institutionId, studentId);
        Map<String, CourseResponse> courses = courseLookup(institutionId);
        List<CourseGrade> bands = gradeBands(institutionId);

        List<GpaResponse> bySemester = allResults.stream()
                .collect(Collectors.groupingBy(CourseResult::getAcademicSemesterId))
                .entrySet().stream()
                .map(entry -> computeGpa(entry.getKey(), entry.getValue(), courses, bands))
                .toList();

        GpaResponse overall = computeGpa(null, allResults, courses, bands);
        return new CgpaResponse(overall.gpa(), overall.totalUnits(), overall.courseCount(), bySemester);
    }

    private GpaResponse computeGpa(
            String academicSemesterId, List<CourseResult> results, Map<String, CourseResponse> courses,
            List<CourseGrade> bands) {
        BigDecimal weightedPoints = BigDecimal.ZERO;
        int totalUnits = 0;
        int counted = 0;

        for (CourseResult result : results) {
            CourseResponse course = courses.get(result.getCourseId());
            BigDecimal gradePoint = course == null ? null : gradePointFor(bands, result.getScore());
            if (course == null || gradePoint == null) {
                continue;
            }
            weightedPoints = weightedPoints.add(gradePoint.multiply(BigDecimal.valueOf(course.unit())));
            totalUnits += course.unit();
            counted++;
        }

        if (totalUnits == 0) {
            return new GpaResponse(academicSemesterId, null, 0, 0);
        }
        double gpa = weightedPoints.divide(BigDecimal.valueOf(totalUnits), 2, RoundingMode.HALF_UP).doubleValue();
        return new GpaResponse(academicSemesterId, gpa, totalUnits, counted);
    }

    private static BigDecimal gradePointFor(List<CourseGrade> bands, BigDecimal score) {
        return bands.stream()
                .filter(band -> band.getArchivedAt() == null)
                .filter(band -> score.compareTo(band.getMinimumScore()) >= 0
                        && score.compareTo(band.getMaximumScore()) <= 0)
                .map(CourseGrade::getGradeScore)
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

    private List<CourseResultResponse> enrich(String institutionId, List<CourseResult> results) {
        if (results.isEmpty()) {
            return List.of();
        }
        Map<String, CourseResponse> courses = courseLookup(institutionId);
        List<CourseGrade> bands = gradeBands(institutionId);
        return results.stream().map(r -> enrichOne(r, courses, bands)).toList();
    }

    private CourseResultResponse enrichOne(
            CourseResult result, Map<String, CourseResponse> courses, List<CourseGrade> bands) {
        CourseResponse course = courses.get(result.getCourseId());
        CourseGrade band = bands.stream()
                .filter(b -> b.getArchivedAt() == null)
                .filter(b -> result.getScore().compareTo(b.getMinimumScore()) >= 0
                        && result.getScore().compareTo(b.getMaximumScore()) <= 0)
                .findFirst()
                .orElse(null);
        return new CourseResultResponse(
                result.getId(),
                result.getStudentId(),
                result.getCourseId(),
                course == null ? "—" : course.code(),
                course == null ? "—" : course.name(),
                course == null ? 0 : course.unit(),
                result.getAcademicSemesterId(),
                result.getScore(),
                band == null ? null : band.getCode(),
                band == null ? null : band.getRemark(),
                band == null ? null : band.getGradeScore(),
                result.getCreatedAt(),
                result.getUpdatedAt());
    }

    private CourseResult requireOwnResult(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course result not found."));
    }
}
