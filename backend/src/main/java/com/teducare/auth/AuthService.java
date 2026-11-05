package com.teducare.auth;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.config.JwtService;
import com.teducare.institution.Institution;
import com.teducare.institution.InstitutionService;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AuthDirectory authDirectory;
    private final JwtService jwtService;
    private final InstitutionService institutionService;

    public AuthService(
            AuthenticationManager authenticationManager,
            AuthDirectory authDirectory,
            JwtService jwtService,
            InstitutionService institutionService) {
        this.authenticationManager = authenticationManager;
        this.authDirectory = authDirectory;
        this.jwtService = jwtService;
        this.institutionService = institutionService;
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        AuthDirectory.Account account = authDirectory.require(request.username());
        AuthenticatedUserDto user = account.user();

        if (request.institutionSlug() != null && !request.institutionSlug().isBlank()
                && user.institutionId() != null) {
            Institution scoped = institutionService.requireBySlug(request.institutionSlug());
            if (!scoped.getId().equals(user.institutionId())) {
                SecurityContextHolder.clearContext();
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password.");
            }
        }

        String token = jwtService.generateToken(
                account.username(),
                Map.of(
                        "role", user.role(),
                        "userId", user.id()));
        return new LoginResponse(user, token);
    }

    public AuthenticatedUserDto currentUser(Authentication authentication) {
        return authDirectory.require(authentication.getName()).user();
    }

    public void logout() {
        SecurityContextHolder.clearContext();
    }
}
