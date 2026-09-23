package com.teducare.config;

import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

import com.teducare.auth.AuthDirectory;

@Component
public class CustomAuthenticationProvider implements AuthenticationProvider {

    private final AuthDirectory authDirectory;

    public CustomAuthenticationProvider(AuthDirectory authDirectory) {
        this.authDirectory = authDirectory;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String username = String.valueOf(authentication.getPrincipal());
        String password = String.valueOf(authentication.getCredentials());

        AuthDirectory.Account account = authDirectory.find(username)
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password."));

        if (!account.password().equals(password)) {
            throw new BadCredentialsException("Invalid username or password.");
        }

        return new UsernamePasswordAuthenticationToken(account.username(), password, java.util.List.of());
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
