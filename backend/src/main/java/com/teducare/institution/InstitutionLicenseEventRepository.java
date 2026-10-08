package com.teducare.institution;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InstitutionLicenseEventRepository extends JpaRepository<InstitutionLicenseEvent, String> {

    List<InstitutionLicenseEvent> findByInstitutionIdOrderByCreatedAtDesc(String institutionId);
}
