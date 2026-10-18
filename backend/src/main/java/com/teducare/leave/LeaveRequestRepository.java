package com.teducare.leave;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, String> {

    List<LeaveRequest> findByInstitutionIdOrderByCreatedAtDesc(String institutionId);

    List<LeaveRequest> findByInstitutionIdAndStatusOrderByCreatedAtDesc(String institutionId, String status);

    List<LeaveRequest> findByInstitutionIdAndStaffIdOrderByCreatedAtDesc(String institutionId, String staffId);

    Optional<LeaveRequest> findByIdAndInstitutionId(String id, String institutionId);

    /** Every APPROVED request, for any staff member, covering this one day — the overview's "who's on leave today" source. */
    @Query("""
            select r from LeaveRequest r
            where r.institutionId = :institutionId and r.status = 'APPROVED'
              and r.startDate <= :date and r.endDate >= :date
            """)
    List<LeaveRequest> findApprovedCoveringDate(
            @Param("institutionId") String institutionId, @Param("date") LocalDate date);

    /** This staff member's APPROVED requests overlapping [from, to] — drives per-staff history/balance without one query per day. */
    @Query("""
            select r from LeaveRequest r
            where r.institutionId = :institutionId and r.staffId = :staffId and r.status = 'APPROVED'
              and r.startDate <= :to and r.endDate >= :from
            """)
    List<LeaveRequest> findApprovedOverlapping(
            @Param("institutionId") String institutionId,
            @Param("staffId") String staffId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /** PENDING or APPROVED requests for this staff member overlapping a proposed new range — the double-booking guard at request time. */
    @Query("""
            select r from LeaveRequest r
            where r.institutionId = :institutionId and r.staffId = :staffId
              and r.status in ('PENDING', 'APPROVED')
              and r.startDate <= :to and r.endDate >= :from
            """)
    List<LeaveRequest> findActiveOverlapping(
            @Param("institutionId") String institutionId,
            @Param("staffId") String staffId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
