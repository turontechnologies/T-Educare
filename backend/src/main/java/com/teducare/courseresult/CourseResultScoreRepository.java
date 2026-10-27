package com.teducare.courseresult;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseResultScoreRepository extends JpaRepository<CourseResultScore, String> {

    List<CourseResultScore> findByInstitutionIdAndCourseIdAndAcademicSemesterId(
            String institutionId, String courseId, String academicSemesterId);

    List<CourseResultScore> findByInstitutionIdAndStudentIdAndAcademicSemesterId(
            String institutionId, String studentId, String academicSemesterId);

    List<CourseResultScore> findByInstitutionIdAndStudentIdOrderByCreatedAtAsc(
            String institutionId, String studentId);

    Optional<CourseResultScore> findByInstitutionIdAndStudentIdAndCourseIdAndAcademicSemesterIdAndComponentId(
            String institutionId, String studentId, String courseId, String academicSemesterId, String componentId);

    List<CourseResultScore> findByInstitutionIdAndCourseIdAndAcademicSemesterIdAndComponentId(
            String institutionId, String courseId, String academicSemesterId, String componentId);

    /** Every score across every course for one semester, in one query — the batched source {@code CourseResultService} groups by course in memory, instead of querying per course. */
    List<CourseResultScore> findByInstitutionIdAndAcademicSemesterId(String institutionId, String academicSemesterId);
}
