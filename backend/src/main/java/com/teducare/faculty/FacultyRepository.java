package com.teducare.faculty;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FacultyRepository extends JpaRepository<Faculty, String> {

    List<Faculty> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<Faculty> findByIdAndInstitutionId(String id, String institutionId);

    boolean existsByInstitutionIdAndNameIgnoreCaseAndArchivedAtIsNull(String institutionId, String name);
}
