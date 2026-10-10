package com.teducare.staff;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffDisciplinaryRecordRepository extends JpaRepository<StaffDisciplinaryRecord, String> {

    List<StaffDisciplinaryRecord> findByStaffIdOrderByCreatedAtDesc(String staffId);
}
