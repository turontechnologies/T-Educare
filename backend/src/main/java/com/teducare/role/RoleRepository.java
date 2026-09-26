package com.teducare.role;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, String> {

    List<Role> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<Role> findByIdAndInstitutionId(String id, String institutionId);

    boolean existsByInstitutionIdAndNameIgnoreCaseAndArchivedAtIsNull(String institutionId, String name);
}
