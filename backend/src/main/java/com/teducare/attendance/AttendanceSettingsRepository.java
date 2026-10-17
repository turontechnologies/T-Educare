package com.teducare.attendance;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceSettingsRepository extends JpaRepository<AttendanceSettings, String> {

    Optional<AttendanceSettings> findByInstitutionId(String institutionId);
}
