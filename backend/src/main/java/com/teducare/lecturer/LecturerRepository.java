package com.teducare.lecturer;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LecturerRepository extends JpaRepository<Lecturer, String> {

    List<Lecturer> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<Lecturer> findByIdAndInstitutionId(String id, String institutionId);
}
