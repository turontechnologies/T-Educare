package com.teducare.program;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgramRepository extends JpaRepository<Program, String> {

    List<Program> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<Program> findByIdAndInstitutionId(String id, String institutionId);

    boolean existsByInstitutionIdAndNameIgnoreCaseAndArchivedAtIsNull(String institutionId, String name);
}
