package com.teducare.student;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentDisciplinaryRecordRepository extends JpaRepository<StudentDisciplinaryRecord, String> {

    List<StudentDisciplinaryRecord> findByStudentIdOrderByCreatedAtDesc(String studentId);
}
