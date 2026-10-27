package com.teducare.courseresult;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseResultSubmissionRepository extends JpaRepository<CourseResultSubmission, String> {

    List<CourseResultSubmission> findByInstitutionIdAndAcademicSemesterId(String institutionId, String academicSemesterId);

    Optional<CourseResultSubmission> findByInstitutionIdAndCourseIdAndAcademicSemesterId(
            String institutionId, String courseId, String academicSemesterId);

    List<CourseResultSubmission> findByInstitutionIdAndCourseIdInAndAcademicSemesterId(
            String institutionId, List<String> courseIds, String academicSemesterId);
}
