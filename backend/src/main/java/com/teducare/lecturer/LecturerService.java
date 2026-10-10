package com.teducare.lecturer;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.faculty.FacultyService;
import com.teducare.school.SchoolService;

@Service
public class LecturerService {

    private static final Set<String> GENDERS = Set.of("Male", "Female", "Other");
    private static final Set<String> ASSIGNMENT_TYPES = Set.of("school", "faculty");
    private static final Set<String> POSITIONS = Set.of(
            "Dean of a Faculty",
            "Head of Department",
            "Provost",
            "Professor",
            "Associate Professor",
            "Senior Lecturer",
            "Lecturer I",
            "Lecturer II",
            "Assistant Lecturer");

    private final LecturerRepository repository;
    private final SchoolService schoolService;
    private final FacultyService facultyService;

    public LecturerService(LecturerRepository repository, SchoolService schoolService, FacultyService facultyService) {
        this.repository = repository;
        this.schoolService = schoolService;
        this.facultyService = facultyService;
    }

    public List<LecturerResponse> list(String institutionId, String search, boolean includeArchived) {
        String query = search == null ? null : search.trim().toLowerCase();
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(l -> includeArchived || l.getArchivedAt() == null)
                .filter(l -> query == null || query.isBlank()
                        || l.getUsername().toLowerCase().contains(query)
                        || l.getFirstName().toLowerCase().contains(query)
                        || l.getLastName().toLowerCase().contains(query)
                        || l.getPosition().toLowerCase().contains(query))
                .map(LecturerResponse::from)
                .toList();
    }

    public LecturerResponse get(String institutionId, String id) {
        return LecturerResponse.from(requireOwnLecturer(institutionId, id));
    }

    public LecturerResponse create(String institutionId, CreateLecturerRequest request) {
        validateEnum(POSITIONS, request.position(), "position");
        validateEnum(ASSIGNMENT_TYPES, request.assignmentType(), "assignmentType");
        validateEnum(GENDERS, request.gender(), "gender");
        validateUniqueUsername(institutionId, request.username(), null);
        requireOwnAssignment(institutionId, request.assignmentType(), request.assignmentId());

        Lecturer lecturer = new Lecturer(
                "lecturer-" + UUID.randomUUID(),
                institutionId,
                request.username(),
                request.position(),
                request.assignmentType(),
                request.assignmentId(),
                request.gender(),
                request.firstName(),
                request.middleName(),
                request.lastName(),
                request.otherName(),
                request.email(),
                request.phone(),
                Instant.now(),
                null);
        return LecturerResponse.from(repository.save(lecturer));
    }

    public LecturerResponse update(String institutionId, String id, UpdateLecturerRequest request) {
        Lecturer lecturer = requireOwnLecturer(institutionId, id);

        if (isPresent(request.username()) && !request.username().equals(lecturer.getUsername())) {
            validateUniqueUsername(institutionId, request.username(), id);
            lecturer.setUsername(request.username());
        }
        if (isPresent(request.position())) {
            validateEnum(POSITIONS, request.position(), "position");
            lecturer.setPosition(request.position());
        }

        String assignmentType = isPresent(request.assignmentType()) ? request.assignmentType() : lecturer.getAssignmentType();
        String assignmentId = isPresent(request.assignmentId()) ? request.assignmentId() : lecturer.getAssignmentId();
        if (isPresent(request.assignmentType()) || isPresent(request.assignmentId())) {
            validateEnum(ASSIGNMENT_TYPES, assignmentType, "assignmentType");
            requireOwnAssignment(institutionId, assignmentType, assignmentId);
            lecturer.setAssignmentType(assignmentType);
            lecturer.setAssignmentId(assignmentId);
        }

        if (isPresent(request.gender())) {
            validateEnum(GENDERS, request.gender(), "gender");
            lecturer.setGender(request.gender());
        }
        if (isPresent(request.firstName())) {
            lecturer.setFirstName(request.firstName());
        }
        if (request.middleName() != null) {
            lecturer.setMiddleName(request.middleName().isBlank() ? null : request.middleName());
        }
        if (isPresent(request.lastName())) {
            lecturer.setLastName(request.lastName());
        }
        if (request.otherName() != null) {
            lecturer.setOtherName(request.otherName().isBlank() ? null : request.otherName());
        }
        if (isPresent(request.email())) {
            lecturer.setEmail(request.email());
        }
        if (isPresent(request.phone())) {
            lecturer.setPhone(request.phone());
        }

        return LecturerResponse.from(repository.save(lecturer));
    }

    public LecturerResponse archive(String institutionId, String id) {
        Lecturer lecturer = requireOwnLecturer(institutionId, id);
        lecturer.setArchivedAt(Instant.now());
        return LecturerResponse.from(repository.save(lecturer));
    }

    public LecturerResponse restore(String institutionId, String id) {
        Lecturer lecturer = requireOwnLecturer(institutionId, id);
        lecturer.setArchivedAt(null);
        return LecturerResponse.from(repository.save(lecturer));
    }

    /** Skips rows missing a required column, reusing an existing username, or naming an unresolvable school/faculty. */
    public LecturerImportResult importCsv(String institutionId, String csvText) {
        List<Map<String, String>> rows = LecturerCsv.parse(csvText);
        int imported = 0;
        int skipped = 0;

        for (Map<String, String> row : rows) {
            String username = row.getOrDefault("username", "").trim();
            String firstName = row.getOrDefault("firstname", "").trim();
            String middleName = row.getOrDefault("middlename", "").trim();
            String lastName = row.getOrDefault("lastname", "").trim();
            String otherName = row.getOrDefault("othername", "").trim();
            String gender = row.getOrDefault("gender", "Male").trim();
            String position = row.getOrDefault("position", "Lecturer II").trim();
            String assignmentType = row.getOrDefault("assignmenttype", "school").trim();
            String assignmentId = row.getOrDefault("assignmentid", "").trim();
            String email = row.getOrDefault("email", "").trim();
            String phone = row.getOrDefault("phone", "").trim();

            if (username.isEmpty() || firstName.isEmpty() || lastName.isEmpty() || email.isEmpty()
                    || !GENDERS.contains(gender) || !POSITIONS.contains(position)
                    || !ASSIGNMENT_TYPES.contains(assignmentType)
                    || repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                            .anyMatch(existing -> existing.getArchivedAt() == null
                                    && existing.getUsername().equalsIgnoreCase(username))) {
                skipped++;
                continue;
            }

            try {
                requireOwnAssignment(institutionId, assignmentType, assignmentId);
            } catch (ResponseStatusException ex) {
                skipped++;
                continue;
            }

            Lecturer lecturer = new Lecturer(
                    "lecturer-" + UUID.randomUUID(),
                    institutionId,
                    username,
                    position,
                    assignmentType,
                    assignmentId,
                    gender,
                    firstName,
                    middleName.isEmpty() ? null : middleName,
                    lastName,
                    otherName.isEmpty() ? null : otherName,
                    email,
                    phone,
                    Instant.now(),
                    null);
            repository.save(lecturer);
            imported++;
        }

        return new LecturerImportResult(imported, skipped);
    }

    public String exportCsv(String institutionId, boolean includeArchived) {
        List<Lecturer> lecturers = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(l -> includeArchived || l.getArchivedAt() == null)
                .toList();
        return LecturerCsv.write(lecturers);
    }

    /** Never leaks whether a lecturer exists in a different institution — a mismatch reads identically to "not found". Public — reused cross-package by LectureAssignmentService. */
    public Lecturer requireOwnLecturer(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lecturer not found."));
    }

    private void requireOwnAssignment(String institutionId, String assignmentType, String assignmentId) {
        if ("school".equals(assignmentType)) {
            schoolService.requireOwnSchool(institutionId, assignmentId);
        } else {
            facultyService.requireOwnFaculty(institutionId, assignmentId);
        }
    }

    private void validateUniqueUsername(String institutionId, String username, String excludingId) {
        boolean collides = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .anyMatch(existing -> existing.getArchivedAt() == null
                        && !existing.getId().equals(excludingId)
                        && existing.getUsername().equalsIgnoreCase(username));
        if (collides) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username \"" + username + "\" is already in use.");
        }
    }

    private static void validateEnum(Set<String> allowed, String value, String field) {
        if (!allowed.contains(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + field + ": " + value);
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}
