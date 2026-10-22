package com.teducare.courseresult;

import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;
import com.teducare.course.CourseResponse;

import jakarta.validation.Valid;

/**
 * Institution-scoped Course Results — score entry and the GPA/CGPA
 * computed from it, always "my own institution's", resolved from the
 * caller. A caller linked to a Lecturer record (self-service, same
 * {@code institution_admin}-role-plus-linked-id convention as every other
 * self-service surface in this backend) is scoped to their own courses,
 * plus their whole department's if they're linked as its HOD — a pure
 * admin/registrar caller (no {@code lecturerId}) is unrestricted.
 */
@RestController
@RequestMapping("/api/course-results")
public class CourseResultController {

    private final CourseResultService service;
    private final AuthDirectory authDirectory;

    public CourseResultController(CourseResultService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public List<CourseResultResponse> list(
            Authentication authentication,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String courseId,
            @RequestParam String academicSemesterId) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        if (studentId != null && !studentId.isBlank()) {
            return service.listForStudentSemester(caller.institutionId(), studentId, academicSemesterId);
        }
        if (courseId != null && !courseId.isBlank()) {
            Set<String> allowed = service.allowedCourseIds(caller.institutionId(), caller.lecturerId());
            return service.listForCourseSemester(caller.institutionId(), courseId, academicSemesterId, allowed);
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Either studentId or courseId is required.");
    }

    /** The courses the caller may pick from when entering results — their own assignments, plus their HOD department's if any. Only meaningful for a lecturer self-service caller; empty for a pure admin, who isn't scoped at all and uses the plain Courses list instead. */
    @GetMapping("/my/courses")
    public List<CourseResponse> myCourses(Authentication authentication) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        return service.myCourses(caller.institutionId(), caller.lecturerId());
    }

    @PostMapping
    public ResponseEntity<CourseResultResponse> create(
            Authentication authentication, @Valid @RequestBody CreateCourseResultRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        Set<String> allowed = service.allowedCourseIds(caller.institutionId(), caller.lecturerId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(caller.institutionId(), request, allowed));
    }

    @PatchMapping("/{id}")
    public CourseResultResponse update(
            Authentication authentication, @PathVariable String id, @Valid @RequestBody UpdateCourseResultRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        Set<String> allowed = service.allowedCourseIds(caller.institutionId(), caller.lecturerId());
        return service.update(caller.institutionId(), id, request, allowed);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable String id) {
        service.delete(requireCaller(authentication).institutionId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/gpa")
    public GpaResponse gpa(
            Authentication authentication,
            @RequestParam String studentId,
            @RequestParam String academicSemesterId) {
        return service.gpa(requireCaller(authentication).institutionId(), studentId, academicSemesterId);
    }

    @GetMapping("/cgpa")
    public CgpaResponse cgpa(Authentication authentication, @RequestParam String studentId) {
        return service.cgpa(requireCaller(authentication).institutionId(), studentId);
    }

    private AuthenticatedUserDto requireCaller(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        AuthenticatedUserDto caller = authDirectory.find(authentication.getName())
                .map(AuthDirectory.Account::user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required."));

        if (!"institution_admin".equals(caller.role()) || caller.institutionId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Institution admin access required.");
        }
        return caller;
    }
}
