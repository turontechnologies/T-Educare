package com.teducare.finance;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeTypeRepository extends JpaRepository<FeeType, String> {

    List<FeeType> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<FeeType> findByIdAndInstitutionId(String id, String institutionId);

    long countByInstitutionId(String institutionId);
}
