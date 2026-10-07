package com.teducare.course;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, String> {

    List<Course> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<Course> findByIdAndInstitutionId(String id, String institutionId);

    boolean existsByInstitutionIdAndCodeIgnoreCaseAndArchivedAtIsNull(String institutionId, String code);
}
