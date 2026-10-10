package com.teducare.staff;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffQualificationRepository extends JpaRepository<StaffQualification, String> {

    List<StaffQualification> findByStaffIdOrderByCreatedAtDesc(String staffId);

    Optional<StaffQualification> findByIdAndStaffId(String id, String staffId);
}
