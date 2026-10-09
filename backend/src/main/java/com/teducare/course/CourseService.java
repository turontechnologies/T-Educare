package com.teducare.course;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.department.DepartmentService;
import com.teducare.programlevel.ProgramLevelService;
import com.teducare.school.SchoolService;

@Service
public class CourseService {

    private final CourseRepository repository;
    private final DepartmentService departmentService;
    private final SchoolService schoolService;
    private final ProgramLevelService programLevelService;

    public CourseService(
            CourseRepository repository,
            DepartmentService departmentService,
            SchoolService schoolService,
            ProgramLevelService programLevelService) {
        this.repository = repository;
        this.departmentService = departmentService;
        this.schoolService = schoolService;
        this.programLevelService = programLevelService;
    }

    public List<CourseResponse> list(
            String institutionId, String departmentId, String schoolId, String search, boolean includeArchived) {
        String query = search == null ? null : search.trim().toLowerCase();
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(course -> includeArchived || course.getArchivedAt() == null)
                .filter(course -> departmentId == null || departmentId.isBlank()
                        || departmentId.equals(course.getDepartmentId()))
                .filter(course -> schoolId == null || schoolId.isBlank()
                        || schoolId.equals(course.getSchoolId()))
                .filter(course -> query == null || query.isBlank()
                        || course.getName().toLowerCase().contains(query)
                        || course.getCode().toLowerCase().contains(query))
                .map(CourseResponse::from)
                .toList();
    }

    public CourseResponse create(String institutionId, CreateCourseRequest request) {
        // Department and school are validated independently — this
        // resource does not derive one through the other (API_CONTRACT.md §7.10).
        departmentService.requireOwnDepartment(institutionId, request.departmentId());
        schoolService.requireOwnSchool(institutionId, request.schoolId());
        programLevelService.requireOwnProgramLevel(institutionId, request.programLevelId());
        validateUniqueCode(institutionId, request.code(), null);

        Course course = new Course(
                "course-" + UUID.randomUUID(),
                institutionId,
                request.name(),
                request.code(),
                request.departmentId(),
                request.schoolId(),
                request.programLevelId(),
                request.unit(),
                Instant.now(),
                null);
        return CourseResponse.from(repository.save(course));
    }

    public CourseResponse update(String institutionId, String id, UpdateCourseRequest request) {
        Course course = requireOwnCourse(institutionId, id);

        if (isPresent(request.departmentId()) && !request.departmentId().equals(course.getDepartmentId())) {
            departmentService.requireOwnDepartment(institutionId, request.departmentId());
            course.setDepartmentId(request.departmentId());
        }
        if (isPresent(request.schoolId()) && !request.schoolId().equals(course.getSchoolId())) {
            schoolService.requireOwnSchool(institutionId, request.schoolId());
            course.setSchoolId(request.schoolId());
        }
        if (isPresent(request.programLevelId()) && !request.programLevelId().equals(course.getProgramLevelId())) {
            programLevelService.requireOwnProgramLevel(institutionId, request.programLevelId());
            course.setProgramLevelId(request.programLevelId());
        }
        if (request.unit() != null) {
            if (request.unit() < 1 || request.unit() > 10) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unit must be between 1 and 10.");
            }
            course.setUnit(request.unit());
        }
        if (isPresent(request.code())) {
            validateUniqueCode(institutionId, request.code(), id);
            course.setCode(request.code());
        }
        if (isPresent(request.name())) {
            course.setName(request.name());
        }

        return CourseResponse.from(repository.save(course));
    }

    public CourseResponse archive(String institutionId, String id) {
        Course course = requireOwnCourse(institutionId, id);
        course.setArchivedAt(Instant.now());
        return CourseResponse.from(repository.save(course));
    }

    public CourseResponse restore(String institutionId, String id) {
        Course course = requireOwnCourse(institutionId, id);
        course.setArchivedAt(null);
        return CourseResponse.from(repository.save(course));
    }

    /**
     * Skips (rather than fails the whole batch on) rows missing a
     * required column, reusing an existing code, or naming a
     * department/school that doesn't resolve for this institution —
     * matches the documented `/students/import` behavior this mirrors
     * (API_CONTRACT.md §7.2, §7.10).
     */
    public CourseImportResult importCsv(String institutionId, String csvText) {
        List<Map<String, String>> rows = CourseCsv.parse(csvText);
        int imported = 0;
        int skipped = 0;

        for (Map<String, String> row : rows) {
            String name = row.getOrDefault("name", "").trim();
            String code = row.getOrDefault("code", "").trim();
            String departmentId = row.getOrDefault("departmentid", "").trim();
            String schoolId = row.getOrDefault("schoolid", "").trim();
            String programLevelId = row.getOrDefault("programlevelid", "").trim();
            String unitText = row.getOrDefault("unit", "").trim();

            if (name.isEmpty() || code.isEmpty() || departmentId.isEmpty() || schoolId.isEmpty()
                    || programLevelId.isEmpty() || unitText.isEmpty()
                    || repository.existsByInstitutionIdAndCodeIgnoreCaseAndArchivedAtIsNull(institutionId, code)) {
                skipped++;
                continue;
            }

            int unit;
            try {
                unit = Integer.parseInt(unitText);
                if (unit < 1 || unit > 10) {
                    skipped++;
                    continue;
                }
            } catch (NumberFormatException ex) {
                skipped++;
                continue;
            }

            try {
                departmentService.requireOwnDepartment(institutionId, departmentId);
                schoolService.requireOwnSchool(institutionId, schoolId);
                programLevelService.requireOwnProgramLevel(institutionId, programLevelId);
            } catch (ResponseStatusException ex) {
                skipped++;
                continue;
            }

            Course course = new Course(
                    "course-" + UUID.randomUUID(), institutionId, name, code, departmentId, schoolId,
                    programLevelId, unit, Instant.now(), null);
            repository.save(course);
            imported++;
        }

        return new CourseImportResult(imported, skipped);
    }

    public String exportCsv(String institutionId, boolean includeArchived) {
        List<Course> courses = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(course -> includeArchived || course.getArchivedAt() == null)
                .toList();
        return CourseCsv.write(courses);
    }

    /** Never leaks whether a course exists in a different institution — a mismatch reads identically to "not found". Public — reused cross-package by CourseRegistrationService, same promotion pattern as every other sibling-service guard in this hierarchy. */
    public Course requireOwnCourse(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found."));
    }

    private void validateUniqueCode(String institutionId, String code, String excludingId) {
        boolean collides = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .anyMatch(existing -> existing.getArchivedAt() == null
                        && !existing.getId().equals(excludingId)
                        && existing.getCode().equalsIgnoreCase(code));
        if (collides) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A course with that code already exists.");
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}
