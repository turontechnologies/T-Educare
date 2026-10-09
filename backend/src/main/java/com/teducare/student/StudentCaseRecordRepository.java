package com.teducare.student;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentCaseRecordRepository extends JpaRepository<StudentCaseRecord, String> {

    List<StudentCaseRecord> findByStudentIdOrderByCreatedAtDesc(String studentId);

    Optional<StudentCaseRecord> findByIdAndStudentId(String id, String studentId);
}
