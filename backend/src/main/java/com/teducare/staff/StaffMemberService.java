package com.teducare.staff;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.department.DepartmentService;
import com.teducare.staffdesignation.StaffDesignationService;

/**
 * Role and Designation are both independently validated FKs into the
 * same StaffDesignation list (two separate selects over one shared
 * table — the frontend's own precedent, carried over from the mock:
 * "Role" and "Designation" are genuinely two different fields that
 * happen to both draw from the same designation catalog).
 */
@Service
public class StaffMemberService {

    private static final Set<String> GENDERS = Set.of("Male", "Female", "Other");
    private static final Set<String> MARITAL_STATUSES = Set.of("Single", "Married", "Divorced", "Widowed");

    private final StaffMemberRepository repository;
    private final StaffQualificationRepository qualificationRepository;
    private final DepartmentService departmentService;
    private final StaffDesignationService designationService;

    public StaffMemberService(
            StaffMemberRepository repository,
            StaffQualificationRepository qualificationRepository,
            DepartmentService departmentService,
            StaffDesignationService designationService) {
        this.repository = repository;
        this.qualificationRepository = qualificationRepository;
        this.departmentService = departmentService;
        this.designationService = designationService;
    }

    public List<StaffMemberResponse> list(
            String institutionId, String departmentId, String search, boolean includeArchived) {
        String query = search == null ? null : search.trim().toLowerCase();
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(s -> includeArchived || s.getArchivedAt() == null)
                .filter(s -> isBlank(departmentId) || departmentId.equals(s.getDepartmentId()))
                .filter(s -> query == null || query.isBlank()
                        || s.getStaffId().toLowerCase().contains(query)
                        || s.getFirstName().toLowerCase().contains(query)
                        || s.getLastName().toLowerCase().contains(query)
                        || s.getEmail().toLowerCase().contains(query))
                .map(StaffMemberResponse::from)
                .toList();
    }

    public StaffMemberResponse get(String institutionId, String id) {
        return StaffMemberResponse.from(requireOwnStaffMember(institutionId, id));
    }

    public StaffMemberResponse create(String institutionId, CreateStaffMemberRequest request) {
        validateEnum(GENDERS, request.gender(), "gender");
        validateEnum(MARITAL_STATUSES, request.maritalStatus(), "maritalStatus");
        validateUniqueStaffId(institutionId, request.staffId(), null);

        departmentService.requireOwnDepartment(institutionId, request.departmentId());
        designationService.requireOwnStaffDesignation(institutionId, request.roleId());
        designationService.requireOwnStaffDesignation(institutionId, request.designationId());

        StaffMember staff = new StaffMember(
                "staff-" + UUID.randomUUID(),
                institutionId,
                request.staffId(),
                request.roleId(),
                request.designationId(),
                request.departmentId(),
                request.gender(),
                request.firstName(),
                request.middleName(),
                request.lastName(),
                request.otherName(),
                request.maritalStatus(),
                request.email(),
                request.phone(),
                request.emergencyContact(),
                request.dateOfBirth(),
                request.employmentStartDate(),
                request.contactAddress(),
                request.avatarUrl(),
                request.salaryAmount(),
                request.salaryCurrency(),
                Instant.now(),
                null);
        return StaffMemberResponse.from(repository.save(staff));
    }

    public StaffMemberResponse update(String institutionId, String id, UpdateStaffMemberRequest request) {
        StaffMember staff = requireOwnStaffMember(institutionId, id);

        if (isPresent(request.staffId()) && !request.staffId().equals(staff.getStaffId())) {
            validateUniqueStaffId(institutionId, request.staffId(), id);
            staff.setStaffId(request.staffId());
        }
        if (isPresent(request.roleId())) {
            designationService.requireOwnStaffDesignation(institutionId, request.roleId());
            staff.setRoleId(request.roleId());
        }
        if (isPresent(request.designationId())) {
            designationService.requireOwnStaffDesignation(institutionId, request.designationId());
            staff.setDesignationId(request.designationId());
        }
        if (isPresent(request.departmentId())) {
            departmentService.requireOwnDepartment(institutionId, request.departmentId());
            staff.setDepartmentId(request.departmentId());
        }
        if (isPresent(request.gender())) {
            validateEnum(GENDERS, request.gender(), "gender");
            staff.setGender(request.gender());
        }
        if (isPresent(request.firstName())) {
            staff.setFirstName(request.firstName());
        }
        if (request.middleName() != null) {
            staff.setMiddleName(request.middleName());
        }
        if (isPresent(request.lastName())) {
            staff.setLastName(request.lastName());
        }
        if (request.otherName() != null) {
            staff.setOtherName(request.otherName());
        }
        if (isPresent(request.maritalStatus())) {
            validateEnum(MARITAL_STATUSES, request.maritalStatus(), "maritalStatus");
            staff.setMaritalStatus(request.maritalStatus());
        }
        if (isPresent(request.email())) {
            staff.setEmail(request.email());
        }
        if (isPresent(request.phone())) {
            staff.setPhone(request.phone());
        }
        if (isPresent(request.emergencyContact())) {
            staff.setEmergencyContact(request.emergencyContact());
        }
        if (request.dateOfBirth() != null) {
            staff.setDateOfBirth(request.dateOfBirth());
        }
        if (request.employmentStartDate() != null) {
            staff.setEmploymentStartDate(request.employmentStartDate());
        }
        if (isPresent(request.contactAddress())) {
            staff.setContactAddress(request.contactAddress());
        }
        if (request.avatarUrl() != null) {
            staff.setAvatarUrl(request.avatarUrl());
        }
        if (request.salaryAmount() != null) {
            staff.setSalaryAmount(request.salaryAmount());
        }
        if (request.salaryCurrency() != null) {
            staff.setSalaryCurrency(request.salaryCurrency());
        }

        return StaffMemberResponse.from(repository.save(staff));
    }

    public StaffMemberResponse archive(String institutionId, String id) {
        StaffMember staff = requireOwnStaffMember(institutionId, id);
        staff.setArchivedAt(Instant.now());
        return StaffMemberResponse.from(repository.save(staff));
    }

    public StaffMemberResponse restore(String institutionId, String id) {
        StaffMember staff = requireOwnStaffMember(institutionId, id);
        staff.setArchivedAt(null);
        return StaffMemberResponse.from(repository.save(staff));
    }

    public List<StaffQualificationResponse> listQualifications(String institutionId, String staffId) {
        requireOwnStaffMember(institutionId, staffId);
        return qualificationRepository.findByStaffIdOrderByCreatedAtDesc(staffId).stream()
                .map(StaffQualificationResponse::from)
                .toList();
    }

    public StaffQualificationResponse addQualification(
            String institutionId, String staffId, AddStaffQualificationRequest request) {
        requireOwnStaffMember(institutionId, staffId);
        StaffQualification qualification = new StaffQualification(
                "staffqual-" + UUID.randomUUID(),
                staffId,
                request.degree(),
                request.fieldOfStudy(),
                request.institutionAttended(),
                request.yearObtained(),
                Instant.now());
        return StaffQualificationResponse.from(qualificationRepository.save(qualification));
    }

    public void deleteQualification(String institutionId, String staffId, String qualificationId) {
        requireOwnStaffMember(institutionId, staffId);
        StaffQualification qualification = qualificationRepository.findByIdAndStaffId(qualificationId, staffId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Qualification not found."));
        qualificationRepository.delete(qualification);
    }

    /**
     * Skips rows missing a required column, reusing an existing staff
     * ID, or naming a department/role/designation that doesn't resolve
     * for this institution — matches CourseService.importCsv's behavior.
     */
    public StaffImportResult importCsv(String institutionId, String csvText) {
        List<Map<String, String>> rows = StaffCsv.parse(csvText);
        int imported = 0;
        int skipped = 0;

        for (Map<String, String> row : rows) {
            String staffId = row.getOrDefault("staffid", "").trim();
            String roleId = row.getOrDefault("roleid", "").trim();
            String designationId = row.getOrDefault("designationid", "").trim();
            String departmentId = row.getOrDefault("departmentid", "").trim();
            String gender = row.getOrDefault("gender", "").trim();
            String firstName = row.getOrDefault("firstname", "").trim();
            String middleName = row.getOrDefault("middlename", "").trim();
            String lastName = row.getOrDefault("lastname", "").trim();
            String otherName = row.getOrDefault("othername", "").trim();
            String maritalStatus = row.getOrDefault("maritalstatus", "").trim();
            String email = row.getOrDefault("email", "").trim();
            String phone = row.getOrDefault("phone", "").trim();
            String emergencyContact = row.getOrDefault("emergencycontact", "").trim();
            String dateOfBirthText = row.getOrDefault("dateofbirth", "").trim();
            String employmentStartDateText = row.getOrDefault("employmentstartdate", "").trim();
            String contactAddress = row.getOrDefault("contactaddress", "").trim();

            if (staffId.isEmpty() || roleId.isEmpty() || designationId.isEmpty() || departmentId.isEmpty()
                    || gender.isEmpty() || firstName.isEmpty() || lastName.isEmpty() || maritalStatus.isEmpty()
                    || email.isEmpty() || phone.isEmpty() || emergencyContact.isEmpty()
                    || dateOfBirthText.isEmpty() || employmentStartDateText.isEmpty() || contactAddress.isEmpty()
                    || repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                            .anyMatch(existing -> existing.getArchivedAt() == null
                                    && existing.getStaffId().equalsIgnoreCase(staffId))
                    || !GENDERS.contains(gender)
                    || !MARITAL_STATUSES.contains(maritalStatus)) {
                skipped++;
                continue;
            }

            Instant dateOfBirth;
            Instant employmentStartDate;
            try {
                dateOfBirth = Instant.parse(dateOfBirthText);
                employmentStartDate = Instant.parse(employmentStartDateText);
            } catch (Exception ex) {
                skipped++;
                continue;
            }

            try {
                departmentService.requireOwnDepartment(institutionId, departmentId);
                designationService.requireOwnStaffDesignation(institutionId, roleId);
                designationService.requireOwnStaffDesignation(institutionId, designationId);
            } catch (ResponseStatusException ex) {
                skipped++;
                continue;
            }

            StaffMember staff = new StaffMember(
                    "staff-" + UUID.randomUUID(),
                    institutionId,
                    staffId,
                    roleId,
                    designationId,
                    departmentId,
                    gender,
                    firstName,
                    middleName.isEmpty() ? null : middleName,
                    lastName,
                    otherName.isEmpty() ? null : otherName,
                    maritalStatus,
                    email,
                    phone,
                    emergencyContact,
                    dateOfBirth,
                    employmentStartDate,
                    contactAddress,
                    null,
                    null,
                    null,
                    Instant.now(),
                    null);
            repository.save(staff);
            imported++;
        }

        return new StaffImportResult(imported, skipped);
    }

    public String exportCsv(String institutionId, boolean includeArchived) {
        List<StaffMember> staff = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(s -> includeArchived || s.getArchivedAt() == null)
                .toList();
        return StaffCsv.write(staff);
    }

    /** Never leaks whether a staff member exists in a different institution — a mismatch reads identically to "not found". Public — reused cross-package by CourseService for `lecturerId` FK validation. */
    public StaffMember requireOwnStaffMember(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff member not found."));
    }

    private void validateUniqueStaffId(String institutionId, String staffId, String excludingId) {
        boolean collides = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .anyMatch(existing -> existing.getArchivedAt() == null
                        && !existing.getId().equals(excludingId)
                        && existing.getStaffId().equalsIgnoreCase(staffId));
        if (collides) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A staff member with that staff ID already exists.");
        }
    }

    private void validateEnum(Set<String> allowed, String value, String field) {
        if (!allowed.contains(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is not a recognized value.");
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
