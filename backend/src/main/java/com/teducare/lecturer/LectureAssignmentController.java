package com.teducare.lecturer;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

import jakarta.validation.Valid;

/** "Lectures" — which Lecturer teaches which Course, their weekly timetable, and the reschedule-request workflow (API_CONTRACT.md). */
@RestController
@RequestMapping("/api/lecture-assignments")
public class LectureAssignmentController {

    private final LectureAssignmentService service;
    private final AuthDirectory authDirectory;

    public LectureAssignmentController(LectureAssignmentService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public List<LectureAssignmentResponse> list(
            Authentication authentication,
            @RequestParam(required = false) String lecturerId,
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        return service.list(requireInstitutionId(authentication), lecturerId, includeArchived);
    }

    @PostMapping
    public ResponseEntity<LectureAssignmentResponse> create(
            Authentication authentication, @Valid @RequestBody CreateLectureAssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(requireInstitutionId(authentication), request));
    }

    /** Admin view of one lecture assignment's roster — same shape and "current semester" scoping as the lecturer's own {@code /my/students}, just not restricted to the caller's own assignments. */
    @GetMapping("/{id}/students")
    public LecturerCourseRoster students(Authentication authentication, @PathVariable String id) {
        return service.rosterForAssignment(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/archive")
    public LectureAssignmentResponse archive(Authentication authentication, @PathVariable String id) {
        return service.archive(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/restore")
    public LectureAssignmentResponse restore(Authentication authentication, @PathVariable String id) {
        return service.restore(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/timetable-slots")
    public ResponseEntity<TimetableSlotResponse> addSlot(
            Authentication authentication, @PathVariable String id, @Valid @RequestBody CreateTimetableSlotRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addSlot(requireInstitutionId(authentication), id, request));
    }

    @DeleteMapping("/{id}/timetable-slots/{slotId}")
    public ResponseEntity<Void> deleteSlot(
            Authentication authentication, @PathVariable String id, @PathVariable String slotId) {
        service.deleteSlot(requireInstitutionId(authentication), id, slotId);
        return ResponseEntity.noContent().build();
    }

    /** The caller's own current-semester courses with their rosters — {@code lecturerId} is always resolved from the caller's own session, never accepted from the client, same privacy rule as every other self-service endpoint in this backend. */
    @GetMapping("/my/students")
    public List<LecturerCourseRoster> myStudents(Authentication authentication) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        if (caller.lecturerId() == null || caller.lecturerId().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only an account linked to a Lecturer record has a student roster.");
        }
        return service.myStudentRoster(caller.institutionId(), caller.lecturerId());
    }

    @PostMapping("/change-requests")
    public ResponseEntity<TimetableChangeRequestResponse> requestChange(
            Authentication authentication, @Valid @RequestBody RequestTimetableChangeRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        if (caller.lecturerId() == null || caller.lecturerId().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only an account linked to a Lecturer record can request a schedule change.");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.requestChange(caller.institutionId(), caller.lecturerId(), request));
    }

    @GetMapping("/change-requests")
    public List<TimetableChangeRequestResponse> listChangeRequests(
            Authentication authentication, @RequestParam(required = false) String lecturerId) {
        String institutionId = requireInstitutionId(authentication);
        return lecturerId == null || lecturerId.isBlank()
                ? service.listChangeRequests(institutionId)
                : service.listChangeRequestsForLecturer(institutionId, lecturerId);
    }

    @PostMapping("/change-requests/{id}/approve")
    public TimetableChangeRequestResponse approveChange(Authentication authentication, @PathVariable String id) {
        return service.resolveChangeRequest(requireInstitutionId(authentication), id, true);
    }

    @PostMapping("/change-requests/{id}/reject")
    public TimetableChangeRequestResponse rejectChange(Authentication authentication, @PathVariable String id) {
        return service.resolveChangeRequest(requireInstitutionId(authentication), id, false);
    }

    @PostMapping(value = "/import", consumes = "multipart/form-data")
    public TimetableImportResult importCsv(Authentication authentication, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file provided.");
        }
        String institutionId = requireInstitutionId(authentication);
        try {
            String text = new String(file.getBytes(), StandardCharsets.UTF_8);
            return service.importCsv(institutionId, text);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read the uploaded file.");
        }
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            Authentication authentication,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String programLevelId) {
        String csv = service.exportCsv(requireInstitutionId(authentication), departmentId, programLevelId);
        byte[] body = csv.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("timetable.csv").build().toString())
                .body(body);
    }

    private String requireInstitutionId(Authentication authentication) {
        return requireCaller(authentication).institutionId();
    }

    private AuthenticatedUserDto requireCaller(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        AuthenticatedUserDto caller = authDirectory.find(authentication.getName())
                .map(AuthDirectory.Account::user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required."));

        if (!"institution_admin".equals(caller.role()) || caller.institutionId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Institution admin access required.");
        }
        return caller;
    }
}
