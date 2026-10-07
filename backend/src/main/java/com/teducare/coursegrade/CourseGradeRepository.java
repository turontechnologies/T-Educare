package com.teducare.coursegrade;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseGradeRepository extends JpaRepository<CourseGrade, String> {

    List<CourseGrade> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<CourseGrade> findByIdAndInstitutionId(String id, String institutionId);

    boolean existsByInstitutionIdAndCodeIgnoreCaseAndArchivedAtIsNull(String institutionId, String code);
}
