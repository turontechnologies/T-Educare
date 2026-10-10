package com.teducare.course;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.department.DepartmentService;
import com.teducare.programlevel.ProgramLevelService;
import com.teducare.school.SchoolService;
import com.teducare.staff.StaffMemberService;

@Service
public class CourseService {

    private final CourseRepository repository;
    private final CourseDepartmentOfferingRepository offeringRepository;
    private final DepartmentService departmentService;
    private final SchoolService schoolService;
    private final ProgramLevelService programLevelService;
    private final StaffMemberService staffMemberService;

    public CourseService(
            CourseRepository repository,
            CourseDepartmentOfferingRepository offeringRepository,
            DepartmentService departmentService,
            SchoolService schoolService,
            ProgramLevelService programLevelService,
            StaffMemberService staffMemberService) {
        this.repository = repository;
        this.offeringRepository = offeringRepository;
        this.departmentService = departmentService;
        this.schoolService = schoolService;
        this.programLevelService = programLevelService;
        this.staffMemberService = staffMemberService;
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
        if (isPresent(request.lecturerId())) {
            staffMemberService.requireOwnStaffMember(institutionId, request.lecturerId());
        }

        Course course = new Course(
                "course-" + UUID.randomUUID(),
                institutionId,
                request.name(),
                request.code(),
                request.departmentId(),
                request.schoolId(),
                request.programLevelId(),
                request.unit(),
                isPresent(request.lecturerId()) ? request.lecturerId() : null,
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
        // Unlike every other field here, a non-null-but-blank lecturerId is meaningful: it explicitly unassigns the lecturer, rather than "no change".
        if (request.lecturerId() != null) {
            if (request.lecturerId().isBlank()) {
                course.setLecturerId(null);
            } else {
                staffMemberService.requireOwnStaffMember(institutionId, request.lecturerId());
                course.setLecturerId(request.lecturerId());
            }
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
                    programLevelId, unit, null, Instant.now(), null);
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

    public List<CourseDepartmentOfferingResponse> listOfferings(String institutionId, String courseId) {
        requireOwnCourse(institutionId, courseId);
        return offeringRepository.findByInstitutionIdAndCourseId(institutionId, courseId).stream()
                .map(CourseDepartmentOfferingResponse::from)
                .toList();
    }

    /** Grants another ("borrowing") department the right to register students for this course — see {@link CourseDepartmentOffering} for why this isn't just a flag on Course itself. */
    public CourseDepartmentOfferingResponse addOffering(
            String institutionId, String courseId, AddCourseDepartmentOfferingRequest request) {
        Course course = requireOwnCourse(institutionId, courseId);
        if (request.departmentId().equals(course.getDepartmentId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "This is already the course's own department.");
        }
        departmentService.requireOwnDepartment(institutionId, request.departmentId());
        if (offeringRepository
                .findByInstitutionIdAndCourseIdAndDepartmentId(institutionId, courseId, request.departmentId())
                .isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "That department already borrows this course.");
        }

        CourseDepartmentOffering offering = new CourseDepartmentOffering(
                "course-offering-" + UUID.randomUUID(),
                institutionId,
                courseId,
                request.departmentId(),
                request.unitOverride(),
                request.compulsory(),
                Instant.now());
        return CourseDepartmentOfferingResponse.from(offeringRepository.save(offering));
    }

    public void removeOffering(String institutionId, String courseId, String offeringId) {
        requireOwnCourse(institutionId, courseId);
        CourseDepartmentOffering offering = offeringRepository
                .findByIdAndInstitutionIdAndCourseId(offeringId, institutionId, courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offering not found."));
        offeringRepository.delete(offering);
    }

    /** True if `departmentId` may register students for `course` — either as its own (home) department, or via a borrowed {@link CourseDepartmentOffering} grant. Public — reused by CourseRegistrationService. */
    public boolean isEligibleForDepartment(String institutionId, Course course, String departmentId) {
        if (course.getDepartmentId().equals(departmentId)) {
            return true;
        }
        return offeringRepository
                .findByInstitutionIdAndCourseIdAndDepartmentId(institutionId, course.getId(), departmentId)
                .isPresent();
    }

    /** The credit-unit load `departmentId` actually carries for `course` — the course's own base unit for its home department, or a borrowing department's own override if one was set (otherwise still the base unit). Public — reused by CourseRegistrationService. */
    public int resolveEffectiveUnit(String institutionId, Course course, String departmentId) {
        if (course.getDepartmentId().equals(departmentId)) {
            return course.getUnit();
        }
        Optional<CourseDepartmentOffering> offering =
                offeringRepository.findByInstitutionIdAndCourseIdAndDepartmentId(
                        institutionId, course.getId(), departmentId);
        return offering.map(CourseDepartmentOffering::getUnitOverride)
                .filter(override -> override != null)
                .orElse(course.getUnit());
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
