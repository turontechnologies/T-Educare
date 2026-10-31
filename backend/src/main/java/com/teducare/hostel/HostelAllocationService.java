package com.teducare.hostel;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.department.DepartmentResponse;
import com.teducare.department.DepartmentService;
import com.teducare.student.Student;
import com.teducare.student.StudentResponse;
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

    /** Every active student not already ALLOCATED (no record yet, WAITLIST, or PENDING_ALLOCATION) — the ones a bulk import actually needs to act on — real matric numbers, blank Hostel Name/Room Number. */
    public String bulkUploadTemplate(String institutionId) {
        Set<String> allocatedStudentIds = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(a -> HostelAllocation.ALLOCATED.equals(a.getStatus()))
                .map(HostelAllocation::getStudentId)
                .collect(Collectors.toSet());
        List<String> matricNos = studentService
                .list(institutionId, null, null, null, null, null, null, null, false).stream()
                .filter(s -> !allocatedStudentIds.contains(s.id()))
                .map(StudentResponse::matricNo)
                .filter(matricNo -> matricNo != null && !matricNo.isBlank())
                .sorted()
                .toList();
        return HostelAllocationCsv.template(matricNos);
    }

    /**
     * Parses a CSV of {@code Matric No, Hostel Name, Room Number} — one
     * row per student, matched by matric number (case-insensitive) and
     * room by name within that hostel (also case-insensitive). A student
     * or room that doesn't resolve is skipped; a blank hostel/room cell is
     * left alone (no allocation decision for that student in this run,
     * same "blank keeps what's already recorded" semantics as {@link
     * com.teducare.courseresult.CourseResultService#bulkUploadScores}).
     * Goes straight to ALLOCATED in one step — unlike the one-at-a-time
     * {@link #addStudent}/{@link #confirm} flow, a bulk import is the
     * institution's already-decided ground truth, not a tentative pick
     * needing a separate confirm. Upserts: a student who already has an
     * allocation record (any status) has it updated in place rather than
     * rejected as a duplicate, so re-running the same file (e.g. with
     * corrections) is safe. Room capacity is tracked as a running count
     * seeded from the real current occupancy, so one file can't overbook a
     * room by assigning more students to it than it holds, and a student
     * moving rooms within the same file correctly frees their old room's
     * slot before claiming the new one.
     */
    public BulkHostelAllocationResult bulkUploadAllocations(String institutionId, String csvText) {
        List<HostelResponse> hostels = hostelService.list(institutionId);
        Map<String, HostelResponse> hostelByName = hostels.stream()
                .collect(Collectors.toMap(h -> h.name().trim().toLowerCase(Locale.ROOT), h -> h, (a, b) -> a));

        Map<String, Integer> runningOccupancy = new HashMap<>();
        for (HostelResponse hostel : hostels) {
            for (HostelRoomResponse room : hostel.rooms()) {
                runningOccupancy.put(room.id(), room.occupiedCount());
            }
        }

        Map<String, StudentResponse> studentsByMatric = studentService
                .list(institutionId, null, null, null, null, null, null, null, false).stream()
                .filter(s -> s.matricNo() != null && !s.matricNo().isBlank())
                .collect(Collectors.toMap(s -> s.matricNo().trim().toLowerCase(Locale.ROOT), s -> s, (a, b) -> a));

        Map<String, HostelAllocation> allocationByStudentId = repository
                .findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .collect(Collectors.toMap(HostelAllocation::getStudentId, a -> a));

        List<Map<String, String>> rows = HostelAllocationCsv.parse(csvText);
        Instant now = Instant.now();
        int updated = 0;
        int skipped = 0;

        for (Map<String, String> row : rows) {
            String matricNo = row.getOrDefault("matric no", row.getOrDefault("matricno", "")).trim();
            String hostelName = row.getOrDefault("hostel name", row.getOrDefault("hostelname", "")).trim();
            String roomNumber = row.getOrDefault("room number", row.getOrDefault("roomnumber", "")).trim();
            if (hostelName.isEmpty() || roomNumber.isEmpty()) {
                continue;
            }

            StudentResponse student = studentsByMatric.get(matricNo.toLowerCase(Locale.ROOT));
            HostelResponse hostel = hostelByName.get(hostelName.toLowerCase(Locale.ROOT));
            HostelRoomResponse room = hostel == null ? null : hostel.rooms().stream()
                    .filter(r -> r.roomNumber().trim().equalsIgnoreCase(roomNumber))
                    .findFirst().orElse(null);
            if (student == null || room == null) {
                skipped++;
                continue;
            }

            HostelAllocation existing = allocationByStudentId.get(student.id());
            boolean alreadyInThisRoom = existing != null
                    && HostelAllocation.ALLOCATED.equals(existing.getStatus())
                    && room.id().equals(existing.getRoomId());

            if (!alreadyInThisRoom) {
                if (runningOccupancy.getOrDefault(room.id(), 0) >= room.capacity()) {
                    skipped++;
                    continue;
                }
                if (existing != null && HostelAllocation.ALLOCATED.equals(existing.getStatus())
                        && existing.getRoomId() != null) {
                    runningOccupancy.merge(existing.getRoomId(), -1, Integer::sum);
                }
                runningOccupancy.merge(room.id(), 1, Integer::sum);
            }

            if (existing != null) {
                existing.setHostelId(hostel.id());
                existing.setRoomId(room.id());
                existing.setStatus(HostelAllocation.ALLOCATED);
                existing.setUpdatedAt(now);
                repository.save(existing);
            } else {
                existing = new HostelAllocation(
                        "hostelalloc-" + UUID.randomUUID(), institutionId, student.id(), hostel.id(), room.id(),
                        HostelAllocation.ALLOCATED, now, now);
                repository.save(existing);
                allocationByStudentId.put(student.id(), existing);
            }
            studentService.assignHostel(institutionId, student.id(), hostel.name(), room.roomNumber());
            updated++;
        }

        return new BulkHostelAllocationResult(updated, skipped);
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
