package com.teducare.auth;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.teducare.institution.Institution;
import com.teducare.institution.InstitutionRepository;

@Component
public class AuthDirectory {

        /**
         * {@code status}/{@code archivedAt} are internal-only — used by
         * CustomAuthenticationProvider to reject a login, never exposed via
         * AuthenticatedUserDto (that's what actually gets serialized to the
         * client).
         */
        public record Account(
                        String username, String password, AuthenticatedUserDto user, String status,
                        Instant archivedAt) {
        }

        private final UserAccountRepository repository;
        private final InstitutionRepository institutionRepository;
        private final PasswordEncoder passwordEncoder;

        public AuthDirectory(
                        UserAccountRepository repository,
                        InstitutionRepository institutionRepository,
                        PasswordEncoder passwordEncoder) {
                this.repository = repository;
                this.institutionRepository = institutionRepository;
                this.passwordEncoder = passwordEncoder;
        }

        public Optional<Account> find(String username) {
                if (username == null || username.isBlank()) {
                        return Optional.empty();
                }
                return repository.findByUsernameIgnoreCase(username.trim()).map(this::toAccount);
        }

        public Account require(String username) {
                return find(username)
                                .orElseThrow(() -> new BadCredentialsException("Invalid username or password."));
        }

        public void updatePassword(String username, String currentPassword, String newPassword) {
                UserAccount entity = requireEntity(username);
                if (!passwordEncoder.matches(currentPassword, entity.getPasswordHash())) {
                        throw new BadCredentialsException("Current password is incorrect.");
                }

                entity.setPasswordHash(passwordEncoder.encode(newPassword));
                repository.save(entity);
        }

        public AuthenticatedUserDto updateProfile(
                        String username, String firstName, String lastName, String email, String phone, String avatarUrl) {
                UserAccount entity = requireEntity(username);

                entity.setFirstName(orDefault(firstName, entity.getFirstName()));
                entity.setLastName(orDefault(lastName, entity.getLastName()));
                entity.setEmail(orDefault(email, entity.getEmail()));
                entity.setPhone(phone != null ? phone : entity.getPhone());
                entity.setAvatarUrl(avatarUrl != null ? avatarUrl : entity.getAvatarUrl());

                return toAccount(repository.save(entity)).user();
        }

        private UserAccount requireEntity(String username) {
                if (username == null || username.isBlank()) {
                        throw new BadCredentialsException("Invalid username or password.");
                }
                return repository.findByUsernameIgnoreCase(username.trim())
                                .orElseThrow(() -> new BadCredentialsException("Invalid username or password."));
        }

        private static String orDefault(String value, String fallback) {
                return value == null || value.isBlank() ? fallback : value;
        }

        private Account toAccount(UserAccount entity) {
                String institutionName = entity.getInstitutionName();
                String institutionLogoUrl = "";

                if (entity.getInstitutionId() != null) {
                        Institution institution = institutionRepository.findById(entity.getInstitutionId())
                                        .orElse(null);
                        if (institution != null) {
                                // Resolved live from the real Institution record rather than the
                                // denormalized snapshot on UserAccount, so a super admin renaming an
                                // institution or setting its logo takes effect on this user's next
                                // login without needing to keep the two in sync by hand.
                                institutionName = institution.getName();
                                // Normalized to "" (never null/omitted) the same way phone/avatarUrl
                                // already are, so the frontend never has to distinguish "no logo"
                                // from "field absent".
                                institutionLogoUrl = institution.getLogoUrl() == null ? "" : institution.getLogoUrl();
                        }
                }

                return new Account(
                                entity.getUsername(),
                                entity.getPasswordHash(),
                                new AuthenticatedUserDto(
                                                entity.getId(),
                                                entity.getFirstName(),
                                                entity.getLastName(),
                                                entity.getEmail(),
                                                entity.getRole(),
                                                entity.getInstitutionId(),
                                                institutionName,
                                                entity.getRoleId(),
                                                splitMenuKeys(entity.getMenuKeys()),
                                                entity.getPhone(),
                                                entity.getAvatarUrl(),
                                                institutionLogoUrl),
                                entity.getStatus(),
                                entity.getArchivedAt());
        }

        private static List<String> splitMenuKeys(String menuKeys) {
                return (menuKeys == null || menuKeys.isBlank()) ? null : List.of(menuKeys.split(","));
        }
}
