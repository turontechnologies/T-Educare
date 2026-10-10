package com.teducare.registration;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.academics.AcademicSemester;
import com.teducare.academics.AcademicSemesterService;
import com.teducare.course.Course;
import com.teducare.course.CourseService;
import com.teducare.elective.ElectiveGroupResponse;
import com.teducare.elective.ElectiveGroupService;
import com.teducare.student.Student;
import com.teducare.student.StudentService;

/**
 * Enforces the two institution-configurable registration rules
 * (API_CONTRACT.md §7.12): carryover-first (a student with outstanding
 * carryover courses — per {@code StudentService.latestCarryoverCourseIds})
 * must include all of them in this same submission before any new-level
 * course is accepted, when {@code RegistrationSettings.requireCarryoverClearance}
 * is on; and the total-unit cap
 * ({@code RegistrationSettings.maxUnitsPerSemester}). Each non-carryover
 * course must also match the student's own department and current level —
 * a student can only register for their department's courses at their
 * level, plus whichever specific courses are their own outstanding
 * carryovers (exempted from the level check, since they're from an
 * earlier level by definition).
 */
@Service
public class CourseRegistrationService {

    private final CourseRegistrationRepository repository;
    private final RegistrationSettingsService settingsService;
    private final StudentService studentService;
    private final CourseService courseService;
    private final AcademicSemesterService academicSemesterService;
    private final ElectiveGroupService electiveGroupService;

    public CourseRegistrationService(
            CourseRegistrationRepository repository,
            RegistrationSettingsService settingsService,
            StudentService studentService,
            CourseService courseService,
            AcademicSemesterService academicSemesterService,
            ElectiveGroupService electiveGroupService) {
        this.repository = repository;
        this.settingsService = settingsService;
        this.studentService = studentService;
        this.courseService = courseService;
        this.academicSemesterService = academicSemesterService;
        this.electiveGroupService = electiveGroupService;
    }

    public List<CourseRegistrationResponse> list(String institutionId, String studentId, String academicSemesterId) {
        studentService.requireOwnStudent(institutionId, studentId);
        academicSemesterService.requireOwnSemester(institutionId, academicSemesterId);
        return repository
                .findByInstitutionIdAndStudentIdAndAcademicSemesterId(institutionId, studentId, academicSemesterId)
                .stream()
                .map(CourseRegistrationResponse::from)
                .toList();
    }

    /** @Transactional because the custom derived delete query below isn't auto-wrapped like save()/deleteById() already are — same reasoning as NotificationService.markAllRead, the only other place in this backend needing it explicitly. */
    @Transactional
    public List<CourseRegistrationResponse> replace(String institutionId, ReplaceCourseRegistrationsRequest request) {
        Student student = studentService.requireOwnStudent(institutionId, request.studentId());
        AcademicSemester semester =
                academicSemesterService.requireOwnSemester(institutionId, request.academicSemesterId());
        RegistrationSettingsResponse settings = settingsService.get(institutionId);
        Set<String> outstandingCarryoverIds =
                Set.copyOf(studentService.latestCarryoverCourseIds(institutionId, request.studentId()));

        List<Course> courses = new ArrayList<>();
        for (String courseId : request.courseIds()) {
            courses.add(courseService.requireOwnCourse(institutionId, courseId));
        }

        // Every selected course must be registrable by the student's own
        // department — either as that department's own (home) course, or
        // via a borrowed CourseDepartmentOffering grant. A non-carryover
        // course must also match the student's current level — a
        // carryover course is exempt from the level check since it's from
        // an earlier level by definition. The semester-of-year check
        // applies regardless of carryover status: a 1st-semester course
        // (carryover or not) can only ever be registered while a
        // 1st-semester instance is open.
        for (Course course : courses) {
            if (!courseService.isEligibleForDepartment(institutionId, course, student.getDepartmentId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Course " + course.getCode() + " is not offered for this student's department.");
            }
            boolean isCarryover = outstandingCarryoverIds.contains(course.getId());
            if (!isCarryover && !course.getProgramLevelId().equals(student.getProgramLevelId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Course " + course.getCode() + " is not offered at this student's current level.");
            }
            if (course.getSemesterNumber() != null && semester.getSemesterNumber() != null
                    && !course.getSemesterNumber().equals(semester.getSemesterNumber())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Course " + course.getCode() + " is a semester " + course.getSemesterNumber()
                                + " course and is not offered in this semester.");
            }
        }

        if (settings.requireCarryoverClearance()) {
            List<String> selectedIds = request.courseIds();
            List<String> missing = outstandingCarryoverIds.stream()
                    .filter(id -> !selectedIds.contains(id))
                    .toList();
            if (!missing.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Outstanding carryover course(s) must be registered before new courses: "
                                + String.join(", ", missing));
            }
        }

        // "Choose N of these courses" requirements (API_CONTRACT.md's
        // elective-group model) — every applicable group for this
        // student's department+level must have between minSelect and
        // maxSelect of its own member courses present in this submission.
        List<ElectiveGroupResponse> applicableGroups = electiveGroupService.findApplicable(
                institutionId, student.getDepartmentId(), student.getProgramLevelId());
        for (ElectiveGroupResponse group : applicableGroups) {
            long selectedFromGroup = request.courseIds().stream().filter(group.courseIds()::contains).count();
            if (selectedFromGroup < group.minSelect() || selectedFromGroup > group.maxSelect()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Elective group \"" + group.name() + "\" requires choosing between " + group.minSelect()
                                + " and " + group.maxSelect() + " course(s) — " + selectedFromGroup + " selected.");
            }
        }

        int totalUnits = courses.stream()
                .mapToInt(course -> courseService.resolveEffectiveUnit(institutionId, course, student.getDepartmentId()))
                .sum();
        if (totalUnits > settings.maxUnitsPerSemester()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Total units (" + totalUnits + ") exceed the maximum of " + settings.maxUnitsPerSemester()
                            + " units per semester.");
        }

        repository.deleteByInstitutionIdAndStudentIdAndAcademicSemesterId(
                institutionId, request.studentId(), request.academicSemesterId());

        List<CourseRegistration> saved = new ArrayList<>();
        for (Course course : courses) {
            saved.add(repository.save(new CourseRegistration(
                    "course-reg-" + UUID.randomUUID(),
                    institutionId,
                    request.studentId(),
                    course.getId(),
                    request.academicSemesterId(),
                    courseService.resolveEffectiveUnit(institutionId, course, student.getDepartmentId()),
                    outstandingCarryoverIds.contains(course.getId()),
                    Instant.now())));
        }

        return saved.stream().map(CourseRegistrationResponse::from).toList();
    }
}
