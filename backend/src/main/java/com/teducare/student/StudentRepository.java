package com.teducare.student;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, String> {

    List<Student> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<Student> findByIdAndInstitutionId(String id, String institutionId);

    boolean existsByInstitutionIdAndMatricNoIgnoreCaseAndArchivedAtIsNull(String institutionId, String matricNo);

    long countByInstitutionIdAndArchivedAtIsNull(String institutionId);

    /** Platform-wide active student count — the real backing for the super admin dashboard's "total student population" stat. */
    long countByArchivedAtIsNull();

    List<Student> findByInstitutionIdAndArchivedAtIsNullOrderByCreatedAtDesc(String institutionId);

    /** Student Portal login — matric no is unique within an institution and, in practice, system-wide since each institution's prefix differs. */
    Optional<Student> findFirstByMatricNoIgnoreCaseAndArchivedAtIsNull(String matricNo);
}
