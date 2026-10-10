package com.teducare.course;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseDepartmentOfferingRepository extends JpaRepository<CourseDepartmentOffering, String> {

    List<CourseDepartmentOffering> findByInstitutionIdAndCourseId(String institutionId, String courseId);

    Optional<CourseDepartmentOffering> findByInstitutionIdAndCourseIdAndDepartmentId(
            String institutionId, String courseId, String departmentId);

    Optional<CourseDepartmentOffering> findByIdAndInstitutionIdAndCourseId(
            String id, String institutionId, String courseId);
}
