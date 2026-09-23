package com.teducare.auth;

import java.util.Map;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.teducare.config.JwtService;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AuthDirectory authDirectory;
    private final JwtService jwtService;

    public AuthService(
            AuthenticationManager authenticationManager,
            AuthDirectory authDirectory,
            JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.authDirectory = authDirectory;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        AuthDirectory.Account account = authDirectory.require(request.username());
        AuthenticatedUserDto user = account.user();
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
