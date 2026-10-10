package com.teducare.lecturer;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TimetableChangeRequestRepository extends JpaRepository<TimetableChangeRequest, String> {

    List<TimetableChangeRequest> findByInstitutionIdOrderByCreatedAtDesc(String institutionId);

    List<TimetableChangeRequest> findByRequestedByLecturerIdOrderByCreatedAtDesc(String lecturerId);

    Optional<TimetableChangeRequest> findByIdAndInstitutionId(String id, String institutionId);
}
