package com.teducare.auth;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.teducare.config.JwtService;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            String token = jwtService.generateToken(request.username(), Map.of("role", "institution_admin"));
            AuthenticatedUserDto user = new AuthenticatedUserDto(
                    "usr_123",
                    "Christian",
                    "Smart",
                    "christian.smart@turontech.com",
                    "institution_admin",
                    "inst-xyz-college",
                    "XYZ College of Technology",
                    "role-institution-admin",
                    List.of("dashboard", "registration", "students", "user-management"));
            return ResponseEntity.ok(new LoginResponse(user, token));
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Invalid username or password.");
        }
    }

    @GetMapping("/auth/me")
    public ResponseEntity<AuthenticatedUserDto> me(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing bearer token.");
        }

        String token = authorization.substring(7);
        if (!jwtService.isValid(token)) {
            throw new BadCredentialsException("Invalid or expired token.");
        }

        AuthenticatedUserDto user = new AuthenticatedUserDto(
                "usr_123",
                "Christian",
                "Smart",
                "christian.smart@turontech.com",
                "institution_admin",
                "inst-xyz-college",
                "XYZ College of Technology",
                "role-institution-admin",
                List.of("dashboard", "registration", "students", "user-management"));
        return ResponseEntity.ok(user);
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }
}
