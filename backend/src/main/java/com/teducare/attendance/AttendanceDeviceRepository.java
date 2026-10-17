package com.teducare.attendance;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceDeviceRepository extends JpaRepository<AttendanceDevice, String> {

    List<AttendanceDevice> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<AttendanceDevice> findByIdAndInstitutionId(String id, String institutionId);

    /** Every active device across every institution — the clock-event endpoint has no institutionId of its own, it's resolved FROM the matching device. */
    List<AttendanceDevice> findByStatus(String status);
}
