package com.teducare.student;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, String> {

    List<Student> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<Student> findByIdAndInstitutionId(String id, String institutionId);

    boolean existsByInstitutionIdAndMatricNoIgnoreCaseAndArchivedAtIsNull(String institutionId, String matricNo);
}
