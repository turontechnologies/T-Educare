package com.teducare.config;

import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.teducare.auth.AuthDirectory;
import com.teducare.institution.Institution;
import com.teducare.institution.InstitutionRepository;

@Component
public class CustomAuthenticationProvider implements AuthenticationProvider {

    private final AuthDirectory authDirectory;
    private final PasswordEncoder passwordEncoder;
    private final InstitutionRepository institutionRepository;

    public CustomAuthenticationProvider(
            AuthDirectory authDirectory,
            PasswordEncoder passwordEncoder,
            InstitutionRepository institutionRepository) {
        this.authDirectory = authDirectory;
        this.passwordEncoder = passwordEncoder;
        this.institutionRepository = institutionRepository;
    }

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String username = String.valueOf(authentication.getPrincipal());
        String password = String.valueOf(authentication.getCredentials());

        AuthDirectory.Account account = authDirectory.find(username)
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password."));

        if (!passwordEncoder.matches(password, account.password())) {
            throw new BadCredentialsException("Invalid username or password.");
        }

        if (account.archivedAt() != null || "inactive".equals(account.status())) {
            throw new BadCredentialsException(
                    "Your account has been deactivated. Contact the platform administrator.");
        }

        String institutionId = account.user().institutionId();
        if (institutionId != null) {
            Institution institution = institutionRepository.findById(institutionId).orElse(null);
            if (institution != null && "inactive".equals(institution.getStatus())) {
                throw new BadCredentialsException(
                        "Your institution's access has been deactivated. Contact the platform administrator.");
            }
        }

        return new UsernamePasswordAuthenticationToken(account.username(), password, java.util.List.of());
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
