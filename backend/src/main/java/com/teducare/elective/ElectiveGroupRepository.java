package com.teducare.elective;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ElectiveGroupRepository extends JpaRepository<ElectiveGroup, String> {

    List<ElectiveGroup> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<ElectiveGroup> findByIdAndInstitutionId(String id, String institutionId);

    List<ElectiveGroup> findByInstitutionIdAndDepartmentIdAndProgramLevelIdAndArchivedAtIsNull(
            String institutionId, String departmentId, String programLevelId);
}
