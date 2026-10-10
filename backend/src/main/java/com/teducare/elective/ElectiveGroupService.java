package com.teducare.elective;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.course.Course;
import com.teducare.course.CourseService;
import com.teducare.department.DepartmentService;
import com.teducare.programlevel.ProgramLevelService;

@Service
public class ElectiveGroupService {

    private final ElectiveGroupRepository repository;
    private final DepartmentService departmentService;
    private final ProgramLevelService programLevelService;
    private final CourseService courseService;

    public ElectiveGroupService(
            ElectiveGroupRepository repository,
            DepartmentService departmentService,
            ProgramLevelService programLevelService,
            CourseService courseService) {
        this.repository = repository;
        this.departmentService = departmentService;
        this.programLevelService = programLevelService;
        this.courseService = courseService;
    }

    public List<ElectiveGroupResponse> list(String institutionId, boolean includeArchived) {
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(group -> includeArchived || group.getArchivedAt() == null)
                .map(ElectiveGroupResponse::from)
                .toList();
    }

    public ElectiveGroupResponse create(String institutionId, CreateElectiveGroupRequest request) {
        departmentService.requireOwnDepartment(institutionId, request.departmentId());
        programLevelService.requireOwnProgramLevel(institutionId, request.programLevelId());
        validateSelectionBounds(request.minSelect(), request.maxSelect(), request.courseIds().size());
        validateCourses(institutionId, request.departmentId(), request.courseIds());

        ElectiveGroup group = new ElectiveGroup(
                "elective-" + UUID.randomUUID(),
                institutionId,
                request.departmentId(),
                request.programLevelId(),
                request.name(),
                request.minSelect(),
                request.maxSelect(),
                String.join(",", request.courseIds()),
                Instant.now(),
                null);
        return ElectiveGroupResponse.from(repository.save(group));
    }

    public ElectiveGroupResponse update(String institutionId, String id, UpdateElectiveGroupRequest request) {
        ElectiveGroup group = requireOwnElectiveGroup(institutionId, id);

        String departmentId = isPresent(request.departmentId()) ? request.departmentId() : group.getDepartmentId();
        if (isPresent(request.departmentId())) {
            departmentService.requireOwnDepartment(institutionId, request.departmentId());
            group.setDepartmentId(request.departmentId());
        }
        if (isPresent(request.programLevelId())) {
            programLevelService.requireOwnProgramLevel(institutionId, request.programLevelId());
            group.setProgramLevelId(request.programLevelId());
        }
        if (isPresent(request.name())) {
            group.setName(request.name());
        }

        int minSelect = request.minSelect() != null ? request.minSelect() : group.getMinSelect();
        int maxSelect = request.maxSelect() != null ? request.maxSelect() : group.getMaxSelect();
        List<String> courseIds = request.courseIds() != null
                ? request.courseIds()
                : List.of(group.getCourseIds().split(","));
        validateSelectionBounds(minSelect, maxSelect, courseIds.size());
        if (request.courseIds() != null) {
            validateCourses(institutionId, departmentId, courseIds);
            group.setCourseIds(String.join(",", courseIds));
        }
        group.setMinSelect(minSelect);
        group.setMaxSelect(maxSelect);

        return ElectiveGroupResponse.from(repository.save(group));
    }

    public ElectiveGroupResponse archive(String institutionId, String id) {
        ElectiveGroup group = requireOwnElectiveGroup(institutionId, id);
        group.setArchivedAt(Instant.now());
        return ElectiveGroupResponse.from(repository.save(group));
    }

    public ElectiveGroupResponse restore(String institutionId, String id) {
        ElectiveGroup group = requireOwnElectiveGroup(institutionId, id);
        group.setArchivedAt(null);
        return ElectiveGroupResponse.from(repository.save(group));
    }

    /** Every active elective group scoped to this exact department+level — what CourseRegistrationService checks a submission against. */
    public List<ElectiveGroupResponse> findApplicable(String institutionId, String departmentId, String programLevelId) {
        return repository
                .findByInstitutionIdAndDepartmentIdAndProgramLevelIdAndArchivedAtIsNull(
                        institutionId, departmentId, programLevelId)
                .stream()
                .map(ElectiveGroupResponse::from)
                .toList();
    }

    public ElectiveGroup requireOwnElectiveGroup(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Elective group not found."));
    }

    private void validateSelectionBounds(int minSelect, int maxSelect, int courseCount) {
        if (courseCount < 2) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "An elective group needs at least two courses to choose between.");
        }
        if (minSelect > maxSelect) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Minimum selection cannot exceed maximum selection.");
        }
        if (maxSelect > courseCount) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Maximum selection cannot exceed the number of courses in the group.");
        }
    }

    /** Every course in the group must exist for this institution and actually be registrable by this department (native or borrowed) — an elective "choice" that isn't a real option for these students would be a silent trap. */
    private void validateCourses(String institutionId, String departmentId, List<String> courseIds) {
        for (String courseId : courseIds) {
            Course course = courseService.requireOwnCourse(institutionId, courseId);
            if (!courseService.isEligibleForDepartment(institutionId, course, departmentId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Course " + course.getCode() + " is not offered for this department — borrow it first.");
            }
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}
