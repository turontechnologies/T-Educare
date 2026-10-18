package com.teducare.leave;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaveTypeRepository extends JpaRepository<LeaveType, String> {

    List<LeaveType> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<LeaveType> findByIdAndInstitutionId(String id, String institutionId);

    boolean existsByInstitutionIdAndNameIgnoreCaseAndArchivedAtIsNull(String institutionId, String name);
}
