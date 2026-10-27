package com.teducare.hostel;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One student's hostel housing state — exactly one row per student
 * (enforced by a unique index on institution_id+student_id), rather than
 * a history of past allocations, since the design has no "past
 * allocations" view, only the three live states below. {@code hostelId}/
 * {@code roomId} are null while WAITLIST (no room proposed yet) and
 * populated for both PENDING_ALLOCATION (admin's tentative pick, not yet
 * confirmed — doesn't occupy a bedspace) and ALLOCATED (confirmed,
 * occupies a bedspace and is mirrored onto {@code Student.hostelName}/
 * {@code roomNumber} by {@code StudentService.assignHostel}).
 *
 * <p>Status transitions (see {@code HostelAllocationService}):
 * <pre>
 * WAITLIST --(propose: pick hostel+room)--&gt; PENDING_ALLOCATION
 * PENDING_ALLOCATION --(confirm/"Allocate")--&gt; ALLOCATED
 * ALLOCATED --(confirm/"Change room")--&gt; ALLOCATED (new room)
 * any --(moveToWaitlist)--&gt; WAITLIST
 * PENDING_ALLOCATION --(reject, deleted)
 * ALLOCATED --(remove, deleted)
 * </pre>
 */
@Entity
@Table(name = "hostel_allocations", schema = "dbo")
public class HostelAllocation {

    public static final String PENDING_ALLOCATION = "PENDING_ALLOCATION";
    public static final String ALLOCATED = "ALLOCATED";
    public static final String WAITLIST = "WAITLIST";

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "hostel_id", length = 64)
    private String hostelId;

    @Column(name = "room_id", length = 64)
    private String roomId;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected HostelAllocation() {
    }

    public HostelAllocation(
            String id,
            String institutionId,
            String studentId,
            String hostelId,
            String roomId,
            String status,
            Instant createdAt,
            Instant updatedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.studentId = studentId;
        this.hostelId = hostelId;
        this.roomId = roomId;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getHostelId() {
        return hostelId;
    }

    public void setHostelId(String hostelId) {
        this.hostelId = hostelId;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
