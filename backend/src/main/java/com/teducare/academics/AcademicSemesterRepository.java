package com.teducare.academics;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AcademicSemesterRepository extends JpaRepository<AcademicSemester, String> {

    List<AcademicSemester> findByInstitutionIdOrderByFromDesc(String institutionId);

    Optional<AcademicSemester> findByIdAndInstitutionId(String id, String institutionId);

    List<AcademicSemester> findBySessionId(String sessionId);
}
