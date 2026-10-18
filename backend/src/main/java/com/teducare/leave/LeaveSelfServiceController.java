package com.teducare.leave;

import java.time.Year;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

import jakarta.validation.Valid;

/**
 * A staff member's own leave — requesting it, tracking its status, seeing
 * their balance, and submitting a resumption report once back. {@code
 * staffId} is always resolved from the caller's own session, never accepted
 * from the client — same privacy rule as Time & Attendance's self-service.
 */
@RestController
@RequestMapping("/api/leave/my")
public class LeaveSelfServiceController {

    private final LeaveTypeService typeService;
    private final LeaveRequestService requestService;
    private final AuthDirectory authDirectory;

    public LeaveSelfServiceController(LeaveTypeService typeService, LeaveRequestService requestService, AuthDirectory authDirectory) {
        this.typeService = typeService;
        this.requestService = requestService;
        this.authDirectory = authDirectory;
    }

    @GetMapping("/types")
    public List<LeaveTypeResponse> types(Authentication authentication) {
        AuthenticatedUserDto caller = requireStaffCaller(authentication);
        return typeService.list(caller.institutionId()).stream()
                .filter(t -> t.archivedAt() == null)
                .toList();
    }

    @GetMapping("/requests")
    public List<LeaveRequestResponse> requests(Authentication authentication) {
        AuthenticatedUserDto caller = requireStaffCaller(authentication);
        return requestService.listForStaff(caller.institutionId(), caller.staffId());
    }

    @PostMapping("/requests")
    public ResponseEntity<LeaveRequestResponse> createRequest(
            Authentication authentication, @Valid @RequestBody CreateLeaveRequestRequest request) {
        AuthenticatedUserDto caller = requireStaffCaller(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(requestService.create(caller.institutionId(), caller.staffId(), request));
    }

    @PostMapping("/requests/{id}/cancel")
    public LeaveRequestResponse cancel(Authentication authentication, @PathVariable String id) {
        AuthenticatedUserDto caller = requireStaffCaller(authentication);
        return requestService.cancel(caller.institutionId(), caller.staffId(), id);
    }

    @PostMapping("/requests/{id}/resume")
    public LeaveRequestResponse resume(
            Authentication authentication, @PathVariable String id, @Valid @RequestBody SubmitResumptionRequest request) {
        AuthenticatedUserDto caller = requireStaffCaller(authentication);
        return requestService.submitResumption(caller.institutionId(), caller.staffId(), id, request);
    }

    @GetMapping("/balance")
    public List<LeaveBalanceResponse> balance(Authentication authentication, @RequestParam(required = false) Integer year) {
        AuthenticatedUserDto caller = requireStaffCaller(authentication);
        int resolvedYear = year == null ? Year.now().getValue() : year;
        return requestService.balancesFor(caller.institutionId(), caller.staffId(), resolvedYear);
    }

    private AuthenticatedUserDto requireStaffCaller(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        AuthenticatedUserDto caller = authDirectory.find(authentication.getName())
                .map(AuthDirectory.Account::user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required."));

        if (caller.staffId() == null || caller.staffId().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "This account isn't linked to a Staff record.");
        }
        return caller;
    }
}
