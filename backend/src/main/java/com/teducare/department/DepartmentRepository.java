package com.teducare.department;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, String> {

    List<Department> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<Department> findByIdAndInstitutionId(String id, String institutionId);

    boolean existsByInstitutionIdAndNameIgnoreCaseAndArchivedAtIsNull(String institutionId, String name);
}
