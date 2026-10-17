package com.teducare.attendance;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceEventRepository extends JpaRepository<AttendanceEvent, String> {

    List<AttendanceEvent> findByInstitutionIdAndStaffIdAndOccurredAtBetweenOrderByOccurredAtAsc(
            String institutionId, String staffId, Instant from, Instant to);

    List<AttendanceEvent> findByInstitutionIdAndOccurredAtBetweenOrderByOccurredAtAsc(
            String institutionId, Instant from, Instant to);
}
