package com.teducare.lecturer;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LectureAssignmentRepository extends JpaRepository<LectureAssignment, String> {

    List<LectureAssignment> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    List<LectureAssignment> findByLecturerIdOrderByCreatedAtAsc(String lecturerId);

    Optional<LectureAssignment> findByIdAndInstitutionId(String id, String institutionId);
}
