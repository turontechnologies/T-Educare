package com.teducare.hostel;

import java.time.Instant;
import java.util.Comparator;
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
 * Hostels and their rooms — occupancy is never stored, always computed at
 * read time from {@link HostelAllocation}, same "never denormalize
 * something computable" rule used throughout this backend. Only ALLOCATED
 * allocations count as occupying a bedspace — a PENDING_ALLOCATION's
 * tentative pick doesn't reserve the room, matching the reference design's
 * free-space counts exactly (confirmed live against the design: a room's
 * "free" count only drops once a student is actually confirmed into it).
 *
 * <p>Occupancy is batched, not computed per room/hostel — loading every
 * allocation for the institution once and grouping in memory, the same
 * fix already applied to Leave's own balances table once it mattered at
 * staff scale (see {@code LeaveRequestService}'s own doc note).
 */
@Service
public class HostelService {

    private final HostelRepository repository;
    private final HostelRoomRepository roomRepository;
    private final HostelAllocationRepository allocationRepository;
    private final DepartmentService departmentService;
    private final StudentService studentService;

    public HostelService(
            HostelRepository repository,
            HostelRoomRepository roomRepository,
            HostelAllocationRepository allocationRepository,
            DepartmentService departmentService,
            StudentService studentService) {
        this.repository = repository;
        this.roomRepository = roomRepository;
        this.allocationRepository = allocationRepository;
        this.departmentService = departmentService;
        this.studentService = studentService;
    }

    public List<HostelResponse> list(String institutionId) {
        List<Hostel> hostels = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId);
        List<HostelRoom> allRooms = hostels.stream()
                .flatMap(h -> roomRepository.findByHostelIdOrderByCreatedAtAsc(h.getId()).stream())
                .toList();
        Map<String, Integer> occupiedByRoomId = occupiedCountByRoomId(institutionId);

        Map<String, List<HostelRoom>> roomsByHostelId = allRooms.stream()
                .collect(Collectors.groupingBy(HostelRoom::getHostelId));
        return hostels.stream()
                .map(h -> toResponse(h, roomsByHostelId.getOrDefault(h.getId(), List.of()), occupiedByRoomId))
                .toList();
    }

    public HostelResponse create(String institutionId, CreateHostelRequest request) {
        Hostel hostel = new Hostel(
                "hostel-" + UUID.randomUUID(), institutionId, request.name(), blankToNull(request.photoUrl()),
                Instant.now());
        repository.save(hostel);
        List<HostelRoom> rooms = saveRooms(hostel.getId(), request.rooms());
        return toResponse(hostel, rooms, Map.of());
    }

    public HostelResponse update(String institutionId, String id, UpdateHostelRequest request) {
        Hostel hostel = requireOwnHostel(institutionId, id);
        hostel.setName(request.name());
        hostel.setPhotoUrl(blankToNull(request.photoUrl()));
        repository.save(hostel);

        List<HostelRoom> existingRooms = roomRepository.findByHostelIdOrderByCreatedAtAsc(id);
        Map<String, Integer> occupiedByRoomId = occupiedCountByRoomId(institutionId);
        List<String> keptRoomNumbers = request.rooms().stream().map(HostelRoomRequest::roomNumber).toList();
        for (HostelRoom existing : existingRooms) {
            if (!keptRoomNumbers.contains(existing.getRoomNumber())
                    && occupiedByRoomId.getOrDefault(existing.getId(), 0) > 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Room " + existing.getRoomNumber() + " still has an allocated student and can't be removed.");
            }
        }
        for (HostelRoom existing : existingRooms) {
            if (!keptRoomNumbers.contains(existing.getRoomNumber())) {
                roomRepository.delete(existing);
            }
        }

        List<HostelRoom> savedRooms = request.rooms().stream()
                .map(roomRequest -> {
                    HostelRoom existing = existingRooms.stream()
                            .filter(r -> r.getRoomNumber().equals(roomRequest.roomNumber()))
                            .findFirst()
                            .orElse(null);
                    HostelRoom toSave = existing != null
                            ? new HostelRoom(existing.getId(), id, roomRequest.roomNumber(), roomRequest.capacity(), existing.getCreatedAt())
                            : new HostelRoom("hostelroom-" + UUID.randomUUID(), id, roomRequest.roomNumber(), roomRequest.capacity(), Instant.now());
                    return roomRepository.save(toSave);
                })
                .toList();

        return toResponse(hostel, savedRooms, occupiedByRoomId);
    }

    /** The "View Student List" dialog — every ALLOCATED occupant of this hostel, matric/name/department/room. */
    public List<HostelRosterStudent> roster(String institutionId, String hostelId) {
        requireOwnHostel(institutionId, hostelId);
        List<HostelRoom> rooms = roomRepository.findByHostelIdOrderByCreatedAtAsc(hostelId);
        Map<String, String> roomNumbersById = rooms.stream()
                .collect(Collectors.toMap(HostelRoom::getId, HostelRoom::getRoomNumber));

        List<HostelAllocation> occupants = allocationRepository.findByHostelId(hostelId).stream()
                .filter(a -> HostelAllocation.ALLOCATED.equals(a.getStatus()))
                .toList();
        if (occupants.isEmpty()) {
            return List.of();
        }

        Map<String, String> departmentNamesById = departmentService
                .list(institutionId, null, null, true).stream()
                .collect(Collectors.toMap(DepartmentResponse::id, DepartmentResponse::name));

        return occupants.stream()
                .map(a -> {
                    Student student = studentService.requireOwnStudent(institutionId, a.getStudentId());
                    return new HostelRosterStudent(
                            student.getId(),
                            student.getMatricNo() != null ? student.getMatricNo() : student.getPreAdmissionId(),
                            fullName(student.getFirstName(), student.getLastName()),
                            departmentNamesById.getOrDefault(student.getDepartmentId(), ""),
                            roomNumbersById.get(a.getRoomId()));
                })
                .sorted(Comparator.comparing(HostelRosterStudent::roomNumber, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    public Hostel requireOwnHostel(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hostel not found."));
    }

    public HostelRoom requireOwnRoom(String institutionId, String hostelId, String roomId) {
        requireOwnHostel(institutionId, hostelId);
        return roomRepository.findByIdAndHostelId(roomId, hostelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found in this hostel."));
    }

    /** One query for every ALLOCATED allocation in the institution, grouped by room — the batched source every occupancy count in this service reads from instead of querying per room. */
    private Map<String, Integer> occupiedCountByRoomId(String institutionId) {
        return allocationRepository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(a -> HostelAllocation.ALLOCATED.equals(a.getStatus()) && a.getRoomId() != null)
                .collect(Collectors.groupingBy(HostelAllocation::getRoomId, Collectors.summingInt(a -> 1)));
    }

    private List<HostelRoom> saveRooms(String hostelId, List<HostelRoomRequest> rooms) {
        return rooms.stream()
                .map(room -> roomRepository.save(new HostelRoom(
                        "hostelroom-" + UUID.randomUUID(), hostelId, room.roomNumber(), room.capacity(), Instant.now())))
                .toList();
    }

    private HostelResponse toResponse(Hostel hostel, List<HostelRoom> rooms, Map<String, Integer> occupiedByRoomId) {
        List<HostelRoomResponse> roomResponses = rooms.stream()
                .map(r -> new HostelRoomResponse(
                        r.getId(), r.getRoomNumber(), r.getCapacity(), occupiedByRoomId.getOrDefault(r.getId(), 0)))
                .toList();
        int totalBedspaces = roomResponses.stream().mapToInt(HostelRoomResponse::capacity).sum();
        int occupiedCount = roomResponses.stream().mapToInt(HostelRoomResponse::occupiedCount).sum();
        return new HostelResponse(
                hostel.getId(), hostel.getName(), hostel.getPhotoUrl(), rooms.size(), totalBedspaces, occupiedCount,
                roomResponses, hostel.getCreatedAt());
    }

    private static String fullName(String firstName, String lastName) {
        return (firstName + " " + lastName).trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
