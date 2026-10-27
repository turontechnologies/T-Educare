package com.teducare.courseresult;

import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

import jakarta.validation.Valid;

/**
 * Results Management — marking guide, grace period, score entry, and the
 * publish workflow (API_CONTRACT.md §16). Always "my own institution's",
 * resolved from the caller; a caller linked to a Lecturer record is scoped
 * to their own courses (plus their HOD department's), a pure admin caller
 * is unrestricted — see {@link CourseResultService#allowedCourseIds}.
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

    // ---- Marking guide ----

    @GetMapping("/marking-guide")
    public MarkingGuideResponse getMarkingGuide(Authentication authentication) {
        return service.getMarkingGuide(requireInstitutionId(authentication));
    }

    @PutMapping("/marking-guide")
    public MarkingGuideResponse updateMarkingGuide(
            Authentication authentication, @Valid @RequestBody UpdateMarkingGuideRequest request) {
        return service.updateMarkingGuide(requireInstitutionId(authentication), request);
    }

    // ---- Grace period ----

    @GetMapping("/grace-period")
    public GracePeriodResponse getGracePeriod(Authentication authentication) {
        return service.getGracePeriod(requireInstitutionId(authentication));
    }

    @PutMapping("/grace-period")
    public GracePeriodResponse updateGracePeriod(
            Authentication authentication, @Valid @RequestBody UpdateGracePeriodRequest request) {
        return service.updateGracePeriod(requireInstitutionId(authentication), request);
    }

    // ---- Course list (admin "Courses" tab / lecturer "My Courses" tab) ----

    @GetMapping("/courses")
    public List<CourseListItemResponse> listCourses(
            Authentication authentication, @RequestParam String academicSemesterId) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        Set<String> allowed = service.allowedCourseIds(caller.institutionId(), caller.lecturerId());
        return service.listCourses(caller.institutionId(), allowed, academicSemesterId);
    }

    @GetMapping("/courses/{courseId}/review")
    public CourseReviewResponse review(
            Authentication authentication, @PathVariable String courseId, @RequestParam String academicSemesterId) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        Set<String> allowed = service.allowedCourseIds(caller.institutionId(), caller.lecturerId());
        return service.review(caller.institutionId(), courseId, academicSemesterId, allowed);
    }

    @PostMapping("/courses/{courseId}/publish")
    public void publish(
            Authentication authentication, @PathVariable String courseId, @RequestParam String academicSemesterId) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        service.publish(caller.institutionId(), courseId, academicSemesterId, callerName(caller));
    }

    @PostMapping("/courses/{courseId}/unpublish")
    public void unpublish(
            Authentication authentication, @PathVariable String courseId, @RequestParam String academicSemesterId,
            @Valid @RequestBody UnpublishRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        service.unpublish(caller.institutionId(), courseId, academicSemesterId, callerName(caller), request);
    }

    @GetMapping("/courses/{courseId}/history")
    public List<CourseResultEventResponse> history(
            Authentication authentication, @PathVariable String courseId, @RequestParam String academicSemesterId) {
        return service.history(requireInstitutionId(authentication), courseId, academicSemesterId);
    }

    // ---- Score entry (lecturer) ----

    @GetMapping("/my/courses/{courseId}")
    public MyCourseProgressResponse myCourseProgress(
            Authentication authentication, @PathVariable String courseId, @RequestParam String academicSemesterId) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        Set<String> allowed = service.allowedCourseIds(caller.institutionId(), caller.lecturerId());
        return service.myCourseProgress(caller.institutionId(), courseId, academicSemesterId, allowed);
    }

    @GetMapping("/my/courses/{courseId}/components/{componentId}/scores")
    public ComponentScoresResponse componentScores(
            Authentication authentication, @PathVariable String courseId, @PathVariable String componentId,
            @RequestParam String academicSemesterId) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        Set<String> allowed = service.allowedCourseIds(caller.institutionId(), caller.lecturerId());
        return service.componentScores(caller.institutionId(), courseId, componentId, academicSemesterId, allowed);
    }

    @PutMapping("/my/courses/{courseId}/components/{componentId}/scores")
    public void saveComponentScores(
            Authentication authentication, @PathVariable String courseId, @PathVariable String componentId,
            @RequestParam String academicSemesterId, @Valid @RequestBody SaveComponentScoresRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        Set<String> allowed = service.allowedCourseIds(caller.institutionId(), caller.lecturerId());
        service.saveComponentScores(caller.institutionId(), courseId, componentId, academicSemesterId, request, allowed);
    }

    @PostMapping("/my/courses/{courseId}/submit")
    public void submit(
            Authentication authentication, @PathVariable String courseId, @RequestParam String academicSemesterId) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        Set<String> allowed = service.allowedCourseIds(caller.institutionId(), caller.lecturerId());
        service.submit(caller.institutionId(), courseId, academicSemesterId, callerName(caller), allowed);
    }

    // ---- Programs (admin, department x level groups) ----

    @GetMapping("/departments")
    public List<DepartmentGroupResponse> listDepartmentGroups(
            Authentication authentication, @RequestParam String academicSemesterId) {
        return service.listDepartmentGroups(requireInstitutionId(authentication), academicSemesterId);
    }

    @GetMapping("/departments/detail")
    public DepartmentGroupDetailResponse departmentGroupDetail(
            Authentication authentication, @RequestParam String departmentId, @RequestParam String programLevelId,
            @RequestParam String academicSemesterId) {
        return service.departmentGroupDetail(
                requireInstitutionId(authentication), departmentId, programLevelId, academicSemesterId);
    }

    // ---- GPA / CGPA ----

    @GetMapping("/gpa")
    public GpaResponse gpa(
            Authentication authentication, @RequestParam String studentId, @RequestParam String academicSemesterId) {
        return service.gpa(requireInstitutionId(authentication), studentId, academicSemesterId);
    }

    @GetMapping("/cgpa")
    public CgpaResponse cgpa(Authentication authentication, @RequestParam String studentId) {
        return service.cgpa(requireInstitutionId(authentication), studentId);
    }

    // ---- Shared guard helpers ----

    private String callerName(AuthenticatedUserDto caller) {
        return caller.firstName() + " " + caller.lastName();
    }

    private String requireInstitutionId(Authentication authentication) {
        return requireCaller(authentication).institutionId();
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
