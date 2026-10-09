package com.teducare.registration;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRegistrationRepository extends JpaRepository<CourseRegistration, String> {

    List<CourseRegistration> findByInstitutionIdAndStudentIdAndAcademicSemesterId(
            String institutionId, String studentId, String academicSemesterId);

    void deleteByInstitutionIdAndStudentIdAndAcademicSemesterId(
            String institutionId, String studentId, String academicSemesterId);
}
