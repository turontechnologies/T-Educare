package com.teducare.finance;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaystackSettingsRepository extends JpaRepository<PaystackSettings, String> {

    Optional<PaystackSettings> findByInstitutionId(String institutionId);
}
