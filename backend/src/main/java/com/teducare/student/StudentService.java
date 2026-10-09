package com.teducare.student;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.academics.AcademicSessionService;
import com.teducare.department.DepartmentService;
import com.teducare.faculty.FacultyService;
import com.teducare.program.ProgramService;
import com.teducare.programlevel.ProgramLevelService;
import com.teducare.school.SchoolService;

/**
 * Every FK below (schoolId/facultyId/departmentId/programId/
 * programLevelId/currentSessionId) is validated independently, none
 * derived through another — same convention as every other multi-FK
 * resource in this hierarchy (Courses, Programs, Departments). The
 * pre-backend mock had faculty/department/programme as free text and
 * currentLevel as a fixed string union; these are now real, independently
 * validated FKs per explicit instruction.
 */
@Service
public class StudentService {

    private static final Set<String> TITLES = Set.of("Mr", "Mrs", "Miss", "Dr", "Chief", "Engr", "Prof");
    private static final Set<String> GENDERS = Set.of("Male", "Female", "Other");
    private static final Set<String> MARITAL_STATUSES = Set.of("Single", "Married", "Divorced", "Widowed");
    private static final Set<String> RELIGIONS = Set.of("Christian", "Islam", "Traditional", "Other");
    private static final Set<String> BLOOD_GROUPS = Set.of("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-");
    private static final Set<String> GENOTYPES = Set.of("AA", "AS", "SS", "AC");
    private static final Set<String> STATUSES = Set.of("active", "inactive");
    private static final Set<String> RECORD_STATUSES = Set.of("completed", "current", "repeat");
    private static final Set<String> DISCIPLINARY_ACTION_TYPES =
            Set.of("SUSPENSION", "EXPULSION", "WARNING", "REINSTATEMENT");
    private static final Set<String> CASE_STATUSES = Set.of("open", "resolved", "dismissed");

    private final StudentRepository repository;
    private final StudentAcademicRecordRepository academicRecordRepository;
    private final StudentDisciplinaryRecordRepository disciplinaryRecordRepository;
    private final StudentCaseRecordRepository caseRecordRepository;
    private final SchoolService schoolService;
    private final FacultyService facultyService;
    private final DepartmentService departmentService;
    private final ProgramService programService;
    private final ProgramLevelService programLevelService;
    private final AcademicSessionService academicSessionService;

    public StudentService(
            StudentRepository repository,
            StudentAcademicRecordRepository academicRecordRepository,
            StudentDisciplinaryRecordRepository disciplinaryRecordRepository,
            StudentCaseRecordRepository caseRecordRepository,
            SchoolService schoolService,
            FacultyService facultyService,
            DepartmentService departmentService,
            ProgramService programService,
            ProgramLevelService programLevelService,
            AcademicSessionService academicSessionService) {
        this.repository = repository;
        this.academicRecordRepository = academicRecordRepository;
        this.disciplinaryRecordRepository = disciplinaryRecordRepository;
        this.caseRecordRepository = caseRecordRepository;
        this.schoolService = schoolService;
        this.facultyService = facultyService;
        this.departmentService = departmentService;
        this.programService = programService;
        this.programLevelService = programLevelService;
        this.academicSessionService = academicSessionService;
    }

    public List<StudentResponse> list(
            String institutionId,
            String search,
            String schoolId,
            String facultyId,
            String departmentId,
            String programId,
            String programLevelId,
            String currentSessionId,
            boolean includeArchived) {
        String query = search == null ? null : search.trim().toLowerCase();
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(s -> includeArchived || s.getArchivedAt() == null)
                .filter(s -> isBlank(schoolId) || schoolId.equals(s.getSchoolId()))
                .filter(s -> isBlank(facultyId) || facultyId.equals(s.getFacultyId()))
                .filter(s -> isBlank(departmentId) || departmentId.equals(s.getDepartmentId()))
                .filter(s -> isBlank(programId) || programId.equals(s.getProgramId()))
                .filter(s -> isBlank(programLevelId) || programLevelId.equals(s.getProgramLevelId()))
                .filter(s -> isBlank(currentSessionId) || currentSessionId.equals(s.getCurrentSessionId()))
                .filter(s -> query == null || query.isBlank()
                        || s.getMatricNo().toLowerCase().contains(query)
                        || s.getFirstName().toLowerCase().contains(query)
                        || s.getLastName().toLowerCase().contains(query)
                        || s.getEmail().toLowerCase().contains(query))
                .map(StudentResponse::from)
                .toList();
    }

    public StudentResponse get(String institutionId, String id) {
        return StudentResponse.from(requireOwnStudent(institutionId, id));
    }

    public StudentResponse create(String institutionId, CreateStudentRequest request) {
        validateEnum(TITLES, request.title(), "title");
        validateEnum(GENDERS, request.gender(), "gender");
        validateEnum(MARITAL_STATUSES, request.maritalStatus(), "maritalStatus");
        validateEnum(RELIGIONS, request.religion(), "religion");
        validateEnum(BLOOD_GROUPS, request.bloodGroup(), "bloodGroup");
        validateEnum(GENOTYPES, request.genotype(), "genotype");
        if (isPresent(request.matricNo())) {
            validateUniqueMatricNo(institutionId, request.matricNo(), null);
        }

        schoolService.requireOwnSchool(institutionId, request.schoolId());
        facultyService.requireOwnFaculty(institutionId, request.facultyId());
        departmentService.requireOwnDepartment(institutionId, request.departmentId());
        programService.requireOwnProgram(institutionId, request.programId());
        programLevelService.requireOwnProgramLevel(institutionId, request.programLevelId());
        academicSessionService.requireOwnSession(institutionId, request.currentSessionId());

        Student student = new Student(
                "student-" + UUID.randomUUID(),
                institutionId,
                request.matricNo(),
                request.title(),
                request.firstName(),
                request.middleName(),
                request.lastName(),
                request.otherName(),
                request.gender(),
                request.maritalStatus(),
                request.email(),
                request.phone(),
                request.emergencyContact(),
                request.dateOfBirth(),
                request.religion(),
                request.maidenName(),
                request.bloodGroup(),
                request.genotype(),
                request.weightKg(),
                request.heightCm(),
                request.nationality(),
                request.stateOfOrigin(),
                request.lga(),
                request.residentAddress(),
                request.avatarUrl(),
                request.schoolId(),
                request.facultyId(),
                request.departmentId(),
                request.programId(),
                request.programLevelId(),
                request.currentSessionId(),
                "active",
                false,
                false,
                false,
                "NONE",
                request.hostelName(),
                request.roomNumber(),
                request.allergies(),
                request.chronicConditions(),
                request.currentMedications(),
                request.pastSurgeries(),
                request.physicianName(),
                request.physicianPhone(),
                request.healthInsuranceProvider(),
                request.healthInsuranceNumber(),
                request.medicalNotes(),
                Instant.now(),
                null);
        Student saved = repository.save(student);

        // Every new student starts with one "current" record at their
        // starting level/session — same seeding behavior the pre-backend
        // mock's own createStudent() had for academicHistory.
        academicRecordRepository.save(new StudentAcademicRecord(
                "record-" + UUID.randomUUID(),
                saved.getId(),
                saved.getCurrentSessionId(),
                saved.getProgramLevelId(),
                "current",
                null,
                Instant.now()));

        return StudentResponse.from(saved);
    }

    public StudentResponse update(String institutionId, String id, UpdateStudentRequest request) {
        Student student = requireOwnStudent(institutionId, id);

        if (isPresent(request.matricNo()) && !request.matricNo().equals(student.getMatricNo())) {
            validateUniqueMatricNo(institutionId, request.matricNo(), id);
            student.setMatricNo(request.matricNo());
        }
        if (isPresent(request.title())) {
            validateEnum(TITLES, request.title(), "title");
            student.setTitle(request.title());
        }
        if (isPresent(request.firstName())) {
            student.setFirstName(request.firstName());
        }
        if (request.middleName() != null) {
            student.setMiddleName(request.middleName());
        }
        if (isPresent(request.lastName())) {
            student.setLastName(request.lastName());
        }
        if (request.otherName() != null) {
            student.setOtherName(request.otherName());
        }
        if (isPresent(request.gender())) {
            validateEnum(GENDERS, request.gender(), "gender");
            student.setGender(request.gender());
        }
        if (isPresent(request.maritalStatus())) {
            validateEnum(MARITAL_STATUSES, request.maritalStatus(), "maritalStatus");
            student.setMaritalStatus(request.maritalStatus());
        }
        if (isPresent(request.email())) {
            student.setEmail(request.email());
        }
        if (isPresent(request.phone())) {
            student.setPhone(request.phone());
        }
        if (isPresent(request.emergencyContact())) {
            student.setEmergencyContact(request.emergencyContact());
        }
        if (request.dateOfBirth() != null) {
            student.setDateOfBirth(request.dateOfBirth());
        }
        if (isPresent(request.religion())) {
            validateEnum(RELIGIONS, request.religion(), "religion");
            student.setReligion(request.religion());
        }
        if (request.maidenName() != null) {
            student.setMaidenName(request.maidenName());
        }
        if (isPresent(request.bloodGroup())) {
            validateEnum(BLOOD_GROUPS, request.bloodGroup(), "bloodGroup");
            student.setBloodGroup(request.bloodGroup());
        }
        if (isPresent(request.genotype())) {
            validateEnum(GENOTYPES, request.genotype(), "genotype");
            student.setGenotype(request.genotype());
        }
        if (request.weightKg() != null) {
            student.setWeightKg(request.weightKg());
        }
        if (request.heightCm() != null) {
            student.setHeightCm(request.heightCm());
        }
        if (isPresent(request.nationality())) {
            student.setNationality(request.nationality());
        }
        if (isPresent(request.stateOfOrigin())) {
            student.setStateOfOrigin(request.stateOfOrigin());
        }
        if (isPresent(request.lga())) {
            student.setLga(request.lga());
        }
        if (isPresent(request.residentAddress())) {
            student.setResidentAddress(request.residentAddress());
        }
        if (request.avatarUrl() != null) {
            student.setAvatarUrl(request.avatarUrl());
        }
        if (isPresent(request.schoolId()) && !request.schoolId().equals(student.getSchoolId())) {
            schoolService.requireOwnSchool(institutionId, request.schoolId());
            student.setSchoolId(request.schoolId());
        }
        if (isPresent(request.facultyId()) && !request.facultyId().equals(student.getFacultyId())) {
            facultyService.requireOwnFaculty(institutionId, request.facultyId());
            student.setFacultyId(request.facultyId());
        }
        if (isPresent(request.departmentId()) && !request.departmentId().equals(student.getDepartmentId())) {
            departmentService.requireOwnDepartment(institutionId, request.departmentId());
            student.setDepartmentId(request.departmentId());
        }
        if (isPresent(request.programId()) && !request.programId().equals(student.getProgramId())) {
            programService.requireOwnProgram(institutionId, request.programId());
            student.setProgramId(request.programId());
        }
        if (isPresent(request.programLevelId()) && !request.programLevelId().equals(student.getProgramLevelId())) {
            programLevelService.requireOwnProgramLevel(institutionId, request.programLevelId());
            student.setProgramLevelId(request.programLevelId());
        }
        if (isPresent(request.currentSessionId()) && !request.currentSessionId().equals(student.getCurrentSessionId())) {
            academicSessionService.requireOwnSession(institutionId, request.currentSessionId());
            student.setCurrentSessionId(request.currentSessionId());
        }
        if (isPresent(request.status())) {
            if (!STATUSES.contains(request.status())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be 'active' or 'inactive'.");
            }
            student.setStatus(request.status());
        }
        if (request.isGraduating() != null) {
            student.setGraduating(request.isGraduating());
        }
        if (request.isDeferred() != null) {
            student.setDeferred(request.isDeferred());
        }
        if (request.holdForReview() != null) {
            student.setHoldForReview(request.holdForReview());
        }
        if (request.hostelName() != null) {
            student.setHostelName(request.hostelName());
        }
        if (request.roomNumber() != null) {
            student.setRoomNumber(request.roomNumber());
        }
        if (request.allergies() != null) {
            student.setAllergies(request.allergies());
        }
        if (request.chronicConditions() != null) {
            student.setChronicConditions(request.chronicConditions());
        }
        if (request.currentMedications() != null) {
            student.setCurrentMedications(request.currentMedications());
        }
        if (request.pastSurgeries() != null) {
            student.setPastSurgeries(request.pastSurgeries());
        }
        if (request.physicianName() != null) {
            student.setPhysicianName(request.physicianName());
        }
        if (request.physicianPhone() != null) {
            student.setPhysicianPhone(request.physicianPhone());
        }
        if (request.healthInsuranceProvider() != null) {
            student.setHealthInsuranceProvider(request.healthInsuranceProvider());
        }
        if (request.healthInsuranceNumber() != null) {
            student.setHealthInsuranceNumber(request.healthInsuranceNumber());
        }
        if (request.medicalNotes() != null) {
            student.setMedicalNotes(request.medicalNotes());
        }

        return StudentResponse.from(repository.save(student));
    }

    public StudentResponse archive(String institutionId, String id) {
        Student student = requireOwnStudent(institutionId, id);
        student.setArchivedAt(Instant.now());
        return StudentResponse.from(repository.save(student));
    }

    public StudentResponse restore(String institutionId, String id) {
        Student student = requireOwnStudent(institutionId, id);
        student.setArchivedAt(null);
        return StudentResponse.from(repository.save(student));
    }

    public List<StudentAcademicRecordResponse> listAcademicHistory(String institutionId, String studentId) {
        requireOwnStudent(institutionId, studentId);
        return academicRecordRepository.findByStudentIdOrderByCreatedAtDesc(studentId).stream()
                .map(StudentAcademicRecordResponse::from)
                .toList();
    }

    /**
     * Appends one history record and moves the student's cached "current"
     * level/session to match — the real persistence primitive a rollover
     * (or manual data entry) calls; this endpoint does not itself decide
     * promote/repeat/carryover, the caller does.
     */
    public StudentAcademicRecordResponse addAcademicRecord(
            String institutionId, String studentId, AddAcademicRecordRequest request) {
        Student student = requireOwnStudent(institutionId, studentId);

        if (!RECORD_STATUSES.contains(request.status())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Status must be 'completed', 'current', or 'repeat'.");
        }
        academicSessionService.requireOwnSession(institutionId, request.academicSessionId());
        programLevelService.requireOwnProgramLevel(institutionId, request.programLevelId());

        List<String> carryoverIds = request.carryoverCourseIds() == null ? List.of() : request.carryoverCourseIds();
        StudentAcademicRecord record = new StudentAcademicRecord(
                "record-" + UUID.randomUUID(),
                studentId,
                request.academicSessionId(),
                request.programLevelId(),
                request.status(),
                carryoverIds.isEmpty() ? null : String.join(",", carryoverIds),
                Instant.now());
        StudentAcademicRecord saved = academicRecordRepository.save(record);

        student.setProgramLevelId(request.programLevelId());
        student.setCurrentSessionId(request.academicSessionId());
        repository.save(student);

        return StudentAcademicRecordResponse.from(saved);
    }

    /**
     * Transitions {@code disciplinaryStatus} and appends an immutable
     * record of the action — same cached-value-plus-audit-log shape as
     * the institution license-status feature's {@code suspend-license}/
     * {@code renew-license}. "REINSTATEMENT" is how a suspension/expulsion
     * is lifted (moves status back to "NONE").
     */
    public StudentDisciplinaryRecordResponse recordDisciplinaryAction(
            String institutionId, String studentId, String actorId, RecordDisciplinaryActionRequest request) {
        Student student = requireOwnStudent(institutionId, studentId);

        if (!DISCIPLINARY_ACTION_TYPES.contains(request.actionType())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "actionType must be SUSPENSION, EXPULSION, WARNING, or REINSTATEMENT.");
        }

        // A WARNING doesn't change standing — only SUSPENSION/EXPULSION/REINSTATEMENT do.
        if ("SUSPENSION".equals(request.actionType())) {
            student.setDisciplinaryStatus("SUSPENDED");
        } else if ("EXPULSION".equals(request.actionType())) {
            student.setDisciplinaryStatus("EXPELLED");
        } else if ("REINSTATEMENT".equals(request.actionType())) {
            student.setDisciplinaryStatus("NONE");
        }
        repository.save(student);

        StudentDisciplinaryRecord record = new StudentDisciplinaryRecord(
                "disc-" + UUID.randomUUID(),
                studentId,
                request.actionType(),
                request.reason(),
                request.startDate(),
                request.endDate(),
                actorId,
                Instant.now());
        return StudentDisciplinaryRecordResponse.from(disciplinaryRecordRepository.save(record));
    }

    public List<StudentDisciplinaryRecordResponse> listDisciplinaryRecords(String institutionId, String studentId) {
        requireOwnStudent(institutionId, studentId);
        return disciplinaryRecordRepository.findByStudentIdOrderByCreatedAtDesc(studentId).stream()
                .map(StudentDisciplinaryRecordResponse::from)
                .toList();
    }

    public StudentCaseRecordResponse reportCase(
            String institutionId, String studentId, String actorId, ReportCaseRequest request) {
        requireOwnStudent(institutionId, studentId);

        StudentCaseRecord record = new StudentCaseRecord(
                "case-" + UUID.randomUUID(),
                studentId,
                request.title(),
                request.description(),
                "open",
                actorId,
                null,
                Instant.now(),
                null);
        return StudentCaseRecordResponse.from(caseRecordRepository.save(record));
    }

    public StudentCaseRecordResponse resolveCase(
            String institutionId, String studentId, String caseId, ResolveCaseRequest request) {
        requireOwnStudent(institutionId, studentId);

        if (!CASE_STATUSES.contains(request.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be open, resolved, or dismissed.");
        }

        StudentCaseRecord record = caseRecordRepository.findByIdAndStudentId(caseId, studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found."));
        record.setStatus(request.status());
        record.setResolutionNotes(request.resolutionNotes());
        if (!"open".equals(request.status())) {
            record.setResolvedAt(Instant.now());
        }
        return StudentCaseRecordResponse.from(caseRecordRepository.save(record));
    }

    public List<StudentCaseRecordResponse> listCases(String institutionId, String studentId) {
        requireOwnStudent(institutionId, studentId);
        return caseRecordRepository.findByStudentIdOrderByCreatedAtDesc(studentId).stream()
                .map(StudentCaseRecordResponse::from)
                .toList();
    }

    /** Never leaks whether a student exists in a different institution — a mismatch reads identically to "not found". Public — reused cross-package by CourseRegistrationService, same promotion pattern as every other sibling-service guard in this hierarchy. */
    public Student requireOwnStudent(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found."));
    }

    /** Newest-first history's most recent record's outstanding carryover course ids — what CourseRegistrationService needs to enforce the carryover-first rule. Empty list if the student has no history yet or nothing outstanding. */
    public List<String> latestCarryoverCourseIds(String institutionId, String studentId) {
        requireOwnStudent(institutionId, studentId);
        return academicRecordRepository.findByStudentIdOrderByCreatedAtDesc(studentId).stream()
                .findFirst()
                .map(record -> StudentAcademicRecordResponse.from(record).carryoverCourseIds())
                .orElse(List.of());
    }

    private void validateUniqueMatricNo(String institutionId, String matricNo, String excludingId) {
        boolean collides = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .anyMatch(existing -> existing.getArchivedAt() == null
                        && !existing.getId().equals(excludingId)
                        && existing.getMatricNo().equalsIgnoreCase(matricNo));
        if (collides) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A student with that matric number already exists.");
        }
    }

    private static void validateEnum(Set<String> allowed, String value, String fieldName) {
        if (!allowed.contains(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + fieldName + ": " + value);
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
