package com.teducare.courseresult;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseResultRepository extends JpaRepository<CourseResult, String> {

    List<CourseResult> findByInstitutionIdAndStudentIdOrderByCreatedAtAsc(String institutionId, String studentId);

    List<CourseResult> findByInstitutionIdAndStudentIdAndAcademicSemesterId(
            String institutionId, String studentId, String academicSemesterId);

    List<CourseResult> findByInstitutionIdAndCourseIdAndAcademicSemesterId(
            String institutionId, String courseId, String academicSemesterId);

    Optional<CourseResult> findByIdAndInstitutionId(String id, String institutionId);

    Optional<CourseResult> findByInstitutionIdAndStudentIdAndCourseIdAndAcademicSemesterId(
            String institutionId, String studentId, String courseId, String academicSemesterId);
}
