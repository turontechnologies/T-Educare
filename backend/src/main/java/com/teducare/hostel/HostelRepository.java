package com.teducare.hostel;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HostelRepository extends JpaRepository<Hostel, String> {

    List<Hostel> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<Hostel> findByIdAndInstitutionId(String id, String institutionId);
}
