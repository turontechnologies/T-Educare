package com.teducare.courseresult;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseResultEventRepository extends JpaRepository<CourseResultEvent, String> {

    List<CourseResultEvent> findByInstitutionIdAndCourseIdAndAcademicSemesterIdOrderByCreatedAtDesc(
            String institutionId, String courseId, String academicSemesterId);
}
