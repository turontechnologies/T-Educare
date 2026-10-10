package com.teducare.staffdesignation;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffDesignationRepository extends JpaRepository<StaffDesignation, String> {

    List<StaffDesignation> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<StaffDesignation> findByIdAndInstitutionId(String id, String institutionId);
}
