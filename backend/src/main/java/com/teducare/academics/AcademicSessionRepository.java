package com.teducare.academics;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AcademicSessionRepository extends JpaRepository<AcademicSession, String> {

    List<AcademicSession> findByInstitutionIdOrderByFromDesc(String institutionId);

    Optional<AcademicSession> findByIdAndInstitutionId(String id, String institutionId);
}
