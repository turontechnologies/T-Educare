package com.teducare.studentauth;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.config.JwtService;
import com.teducare.institution.Institution;
import com.teducare.institution.InstitutionService;
import com.teducare.student.Student;
import com.teducare.student.StudentRepository;

/**
 * Entirely separate from {@code com.teducare.auth} (the staff/admin login
 * stack) — a Student is not a {@code UserAccount} and isn't resolved through
 * AuthDirectory/CustomAuthenticationProvider, so this calls
 * {@link PasswordEncoder#matches} directly rather than going through
 * Spring Security's AuthenticationManager.
 */
@Service
public class StudentAuthService {

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final InstitutionService institutionService;

    public StudentAuthService(
            StudentRepository studentRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            InstitutionService institutionService) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.institutionService = institutionService;
    }

    public StudentLoginResponse login(StudentLoginRequest request) {
        Student student = studentRepository
                .findFirstByMatricNoIgnoreCaseAndArchivedAtIsNull(request.matricNo())
                .orElseThrow(() -> invalidCredentials());

        if (student.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), student.getPasswordHash())) {
            throw invalidCredentials();
        }

        if (request.institutionSlug() != null && !request.institutionSlug().isBlank()) {
            Institution scoped = institutionService.requireBySlug(request.institutionSlug());
            if (!scoped.getId().equals(student.getInstitutionId())) {
                throw invalidCredentials();
            }
        }

        Institution institution = institutionService.requireInstitution(student.getInstitutionId());
        String token = jwtService.generateToken(
                student.getId(),
                Map.of(
                        "role", "student",
                        "studentId", student.getId(),
                        "institutionId", student.getInstitutionId()));
        return new StudentLoginResponse(StudentAuthProfileResponse.from(student, institution), token);
    }

    public StudentAuthProfileResponse me(String studentId, String institutionId) {
        Student student = studentRepository.findByIdAndInstitutionId(studentId, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required."));
        Institution institution = institutionService.requireInstitution(institutionId);
        return StudentAuthProfileResponse.from(student, institution);
    }

    /** Deliberately identical for "no such matric no", "wrong password", and "wrong institution's URL" — never reveals which part was wrong, same non-enumeration discipline as the staff login. */
    private static ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid matric number or password.");
    }
}
