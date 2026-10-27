package com.teducare.hostel;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HostelAllocationRepository extends JpaRepository<HostelAllocation, String> {

    List<HostelAllocation> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<HostelAllocation> findByIdAndInstitutionId(String id, String institutionId);

    Optional<HostelAllocation> findByInstitutionIdAndStudentId(String institutionId, String studentId);

    List<HostelAllocation> findByHostelId(String hostelId);

    List<HostelAllocation> findByRoomId(String roomId);
}
