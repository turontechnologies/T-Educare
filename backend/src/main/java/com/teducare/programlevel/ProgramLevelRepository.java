package com.teducare.programlevel;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgramLevelRepository extends JpaRepository<ProgramLevel, String> {

    List<ProgramLevel> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<ProgramLevel> findByIdAndInstitutionId(String id, String institutionId);

    boolean existsByInstitutionIdAndLevelCodeIgnoreCaseAndArchivedAtIsNull(String institutionId, String levelCode);
}
