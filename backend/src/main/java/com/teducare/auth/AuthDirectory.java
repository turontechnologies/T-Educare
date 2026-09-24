package com.teducare.auth;

import java.util.List;
import java.util.Optional;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AuthDirectory {

        public record Account(String username, String password, AuthenticatedUserDto user) {
        }

        private final UserAccountRepository repository;
        private final PasswordEncoder passwordEncoder;

        public AuthDirectory(UserAccountRepository repository, PasswordEncoder passwordEncoder) {
                this.repository = repository;
                this.passwordEncoder = passwordEncoder;
        }

        public Optional<Account> find(String username) {
                if (username == null || username.isBlank()) {
                        return Optional.empty();
                }
                return repository.findByUsernameIgnoreCase(username.trim()).map(AuthDirectory::toAccount);
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

        private static Account toAccount(UserAccount entity) {
                return new Account(entity.getUsername(), entity.getPasswordHash(), new AuthenticatedUserDto(
                                entity.getId(),
                                entity.getFirstName(),
                                entity.getLastName(),
                                entity.getEmail(),
                                entity.getRole(),
                                entity.getInstitutionId(),
                                entity.getInstitutionName(),
                                entity.getRoleId(),
                                splitMenuKeys(entity.getMenuKeys()),
                                entity.getPhone(),
                                entity.getAvatarUrl()));
        }

        private static List<String> splitMenuKeys(String menuKeys) {
                return (menuKeys == null || menuKeys.isBlank()) ? null : List.of(menuKeys.split(","));
        }
}
