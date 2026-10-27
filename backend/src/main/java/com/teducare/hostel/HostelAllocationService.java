package com.teducare.hostel;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.department.DepartmentResponse;
import com.teducare.department.DepartmentService;
import com.teducare.student.Student;
import com.teducare.student.StudentService;

/**
 * One student's hostel housing workflow — see {@link HostelAllocation}'s
 * own doc comment for the full WAITLIST/PENDING_ALLOCATION/ALLOCATED state
 * machine. Every transition into or out of ALLOCATED calls
 * {@code StudentService.assignHostel} to keep {@code Student.hostelName}/
 * {@code roomNumber}'s cached summary in sync — PENDING_ALLOCATION never
 * touches it, since it isn't confirmed yet.
 */
@Service
public class HostelAllocationService {

    private final HostelAllocationRepository repository;
    private final HostelService hostelService;
    private final StudentService studentService;
    private final DepartmentService departmentService;

    public HostelAllocationService(
            HostelAllocationRepository repository,
            HostelService hostelService,
            StudentService studentService,
            DepartmentService departmentService) {
        this.repository = repository;
        this.hostelService = hostelService;
        this.studentService = studentService;
        this.departmentService = departmentService;
    }

    public List<HostelAllocationResponse> list(String institutionId, String status) {
        List<HostelAllocation> allocations = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(a -> status == null || status.isBlank() || status.equalsIgnoreCase(a.getStatus()))
                .toList();
        if (allocations.isEmpty()) {
            return List.of();
        }

        Map<String, String> departmentNamesById = departmentService.list(institutionId, null, null, true).stream()
                .collect(Collectors.toMap(DepartmentResponse::id, DepartmentResponse::name));
        Map<String, HostelResponse> hostelsById = hostelService.list(institutionId).stream()
                .collect(Collectors.toMap(HostelResponse::id, h -> h));

        return allocations.stream()
                .map(a -> enrich(institutionId, a, departmentNamesById, hostelsById))
                .toList();
    }

    public HostelAllocationResponse addStudent(String institutionId, AddHostelAllocationRequest request) {
        Student student = studentService.requireOwnStudent(institutionId, request.studentId());
        if (repository.findByInstitutionIdAndStudentId(institutionId, request.studentId()).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This student already has a hostel allocation record.");
        }
        hostelService.requireOwnRoom(institutionId, request.hostelId(), request.roomId());

        HostelAllocation allocation = new HostelAllocation(
                "hostelalloc-" + UUID.randomUUID(), institutionId, student.getId(), request.hostelId(),
                request.roomId(), HostelAllocation.PENDING_ALLOCATION, Instant.now(), Instant.now());
        repository.save(allocation);
        return toResponse(institutionId, allocation);
    }

    /** WAITLIST -> PENDING_ALLOCATION ("Move to allocations"): picks a hostel/room but doesn't confirm it yet. */
    public HostelAllocationResponse propose(String institutionId, String id, AssignRoomRequest request) {
        HostelAllocation allocation = requireOwnAllocation(institutionId, id);
        hostelService.requireOwnRoom(institutionId, request.hostelId(), request.roomId());
        allocation.setHostelId(request.hostelId());
        allocation.setRoomId(request.roomId());
        allocation.setStatus(HostelAllocation.PENDING_ALLOCATION);
        allocation.setUpdatedAt(Instant.now());
        repository.save(allocation);
        return toResponse(institutionId, allocation);
    }

    /** -> ALLOCATED ("Allocate" from Pending, or "Change room" from Allocated) — confirms the room and syncs the student's cached hostel/room summary. */
    public HostelAllocationResponse confirm(String institutionId, String id, AssignRoomRequest request) {
        HostelAllocation allocation = requireOwnAllocation(institutionId, id);
        var hostel = hostelService.requireOwnHostel(institutionId, request.hostelId());
        var room = hostelService.requireOwnRoom(institutionId, request.hostelId(), request.roomId());
        allocation.setHostelId(request.hostelId());
        allocation.setRoomId(request.roomId());
        allocation.setStatus(HostelAllocation.ALLOCATED);
        allocation.setUpdatedAt(Instant.now());
        repository.save(allocation);
        studentService.assignHostel(institutionId, allocation.getStudentId(), hostel.getName(), room.getRoomNumber());
        return toResponse(institutionId, allocation);
    }

    /** Any status -> WAITLIST ("Move to waitlist") — clears the tentative/confirmed room and the student's cached summary. */
    public HostelAllocationResponse moveToWaitlist(String institutionId, String id) {
        HostelAllocation allocation = requireOwnAllocation(institutionId, id);
        boolean wasAllocated = HostelAllocation.ALLOCATED.equals(allocation.getStatus());
        allocation.setHostelId(null);
        allocation.setRoomId(null);
        allocation.setStatus(HostelAllocation.WAITLIST);
        allocation.setUpdatedAt(Instant.now());
        repository.save(allocation);
        if (wasAllocated) {
            studentService.assignHostel(institutionId, allocation.getStudentId(), null, null);
        }
        return toResponse(institutionId, allocation);
    }

    /** "Reject" (from Pending) or "Remove from hostel" (from Allocated) — same action, the record no longer serves any purpose once dropped. */
    public void remove(String institutionId, String id) {
        HostelAllocation allocation = requireOwnAllocation(institutionId, id);
        boolean wasAllocated = HostelAllocation.ALLOCATED.equals(allocation.getStatus());
        repository.delete(allocation);
        if (wasAllocated) {
            studentService.assignHostel(institutionId, allocation.getStudentId(), null, null);
        }
    }

    private HostelAllocation requireOwnAllocation(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hostel allocation not found."));
    }

    private HostelAllocationResponse toResponse(String institutionId, HostelAllocation allocation) {
        Map<String, String> departmentNamesById = departmentService.list(institutionId, null, null, true).stream()
                .collect(Collectors.toMap(DepartmentResponse::id, DepartmentResponse::name));
        Map<String, HostelResponse> hostelsById = hostelService.list(institutionId).stream()
                .collect(Collectors.toMap(HostelResponse::id, h -> h));
        return enrich(institutionId, allocation, departmentNamesById, hostelsById);
    }

    private HostelAllocationResponse enrich(
            String institutionId,
            HostelAllocation allocation,
            Map<String, String> departmentNamesById,
            Map<String, HostelResponse> hostelsById) {
        Student student = studentService.requireOwnStudent(institutionId, allocation.getStudentId());
        HostelResponse hostel = allocation.getHostelId() == null ? null : hostelsById.get(allocation.getHostelId());
        String roomNumber = null;
        if (hostel != null && allocation.getRoomId() != null) {
            roomNumber = hostel.rooms().stream()
                    .filter(r -> r.id().equals(allocation.getRoomId()))
                    .findFirst()
                    .map(HostelRoomResponse::roomNumber)
                    .orElse(null);
        }
        return new HostelAllocationResponse(
                allocation.getId(),
                student.getId(),
                student.getMatricNo() != null ? student.getMatricNo() : student.getPreAdmissionId(),
                (student.getFirstName() + " " + student.getLastName()).trim(),
                departmentNamesById.getOrDefault(student.getDepartmentId(), ""),
                allocation.getHostelId(),
                hostel == null ? null : hostel.name(),
                allocation.getRoomId(),
                roomNumber,
                allocation.getStatus(),
                allocation.getCreatedAt());
    }
}
