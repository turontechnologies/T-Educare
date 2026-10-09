package com.teducare.student;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentAcademicRecordRepository extends JpaRepository<StudentAcademicRecord, String> {

    List<StudentAcademicRecord> findByStudentIdOrderByCreatedAtDesc(String studentId);
}
