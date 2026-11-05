package com.teducare.finance;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffPayrollProfileRepository extends JpaRepository<StaffPayrollProfile, String> {

    List<StaffPayrollProfile> findByInstitutionId(String institutionId);

    Optional<StaffPayrollProfile> findByInstitutionIdAndStaffId(String institutionId, String staffId);
}
