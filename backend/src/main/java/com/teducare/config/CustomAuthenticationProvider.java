package com.teducare.config;

import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

@Component
public class CustomAuthenticationProvider implements AuthenticationProvider {

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String username = String.valueOf(authentication.getPrincipal());
        String password = String.valueOf(authentication.getCredentials());

        if ("turon_admin".equalsIgnoreCase(username) && "Turon@2024".equals(password)) {
            return new UsernamePasswordAuthenticationToken(username, password, java.util.List.of());
        }

        if ("amara_bello".equalsIgnoreCase(username) && "Amara@2024".equals(password)) {
            return new UsernamePasswordAuthenticationToken(username, password, java.util.List.of());
        }

        throw new BadCredentialsException("Invalid username or password.");
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
