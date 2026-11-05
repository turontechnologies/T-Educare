package com.teducare.studentauth;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/** The Student Portal's own login — entirely separate from `/api/auth/*` (staff/admin). Registered permitAll (login only) in SecurityConfig. */
@RestController
@RequestMapping("/api/student-auth")
public class StudentAuthController {

    private final StudentAuthService service;
    private final CurrentStudentResolver currentStudentResolver;

    public StudentAuthController(StudentAuthService service, CurrentStudentResolver currentStudentResolver) {
        this.service = service;
        this.currentStudentResolver = currentStudentResolver;
    }

    @PostMapping("/login")
    public StudentLoginResponse login(@Valid @RequestBody StudentLoginRequest request) {
        return service.login(request);
    }

    @GetMapping("/me")
    public StudentAuthProfileResponse me(Authentication authentication) {
        CurrentStudent current = currentStudentResolver.require(authentication);
        return service.me(current.studentId(), current.institutionId());
    }
}
