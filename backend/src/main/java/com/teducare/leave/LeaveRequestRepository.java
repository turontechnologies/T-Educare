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

    /**
     * Every APPROVED request, for any staff member, that <em>started</em> on
     * or before this day — the overview's "who's on leave today" source.
     * Deliberately has no upper bound on {@code endDate}: a request with no
     * APPROVED resumption yet can be effectively ongoing well past its
     * stored {@code endDate} (the auto-extension rule), so {@link
     * LeaveRequestService} computes the real effective end date in Java
     * against each candidate returned here rather than filtering for it in
     * SQL.
     */
    @Query("""
            select r from LeaveRequest r
            where r.institutionId = :institutionId and r.status = 'APPROVED'
              and r.startDate <= :date
            """)
    List<LeaveRequest> findApprovedStartingOnOrBefore(
            @Param("institutionId") String institutionId, @Param("date") LocalDate date);

    /** This staff member's APPROVED requests that started on or before {@code to} — same "no endDate upper bound" reasoning as {@link #findApprovedStartingOnOrBefore}, scoped to one staff member for history/balance lookups. */
    @Query("""
            select r from LeaveRequest r
            where r.institutionId = :institutionId and r.staffId = :staffId and r.status = 'APPROVED'
              and r.startDate <= :to
            """)
    List<LeaveRequest> findApprovedStartingOnOrBeforeForStaff(
            @Param("institutionId") String institutionId,
            @Param("staffId") String staffId,
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
