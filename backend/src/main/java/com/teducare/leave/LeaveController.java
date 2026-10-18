package com.teducare.leave;

import java.time.Year;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
 * Leave Management, institution_admin side — leave type policy, the
 * approval queue, and balances across every staff member. A staff member's
 * own requests/balance/resumption report is {@link LeaveSelfServiceController}.
 */
@RestController
@RequestMapping("/api/leave")
public class LeaveController {

    private final LeaveTypeService typeService;
    private final LeaveRequestService requestService;
    private final AuthDirectory authDirectory;

    public LeaveController(LeaveTypeService typeService, LeaveRequestService requestService, AuthDirectory authDirectory) {
        this.typeService = typeService;
        this.requestService = requestService;
        this.authDirectory = authDirectory;
    }

    @GetMapping("/types")
    public List<LeaveTypeResponse> listTypes(Authentication authentication) {
        return typeService.list(requireInstitutionId(authentication));
    }

    @PostMapping("/types")
    public ResponseEntity<LeaveTypeResponse> createType(
            Authentication authentication, @Valid @RequestBody CreateLeaveTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(typeService.create(requireInstitutionId(authentication), request));
    }

    @PatchMapping("/types/{id}")
    public LeaveTypeResponse updateType(
            Authentication authentication, @PathVariable String id, @RequestBody UpdateLeaveTypeRequest request) {
        return typeService.update(requireInstitutionId(authentication), id, request);
    }

    @PostMapping("/types/{id}/archive")
    public LeaveTypeResponse archiveType(Authentication authentication, @PathVariable String id) {
        return typeService.archive(requireInstitutionId(authentication), id);
    }

    @PostMapping("/types/{id}/restore")
    public LeaveTypeResponse restoreType(Authentication authentication, @PathVariable String id) {
        return typeService.restore(requireInstitutionId(authentication), id);
    }

    @GetMapping("/requests")
    public List<LeaveRequestResponse> listRequests(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String staffId) {
        return requestService.listForInstitution(requireInstitutionId(authentication), status, staffId);
    }

    @PostMapping("/requests/{id}/approve")
    public LeaveRequestResponse approve(
            Authentication authentication, @PathVariable String id, @RequestBody(required = false) ReviewLeaveRequestRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        return requestService.approve(
                caller.institutionId(), id, caller.id(), request == null ? new ReviewLeaveRequestRequest(null) : request);
    }

    @PostMapping("/requests/{id}/reject")
    public LeaveRequestResponse reject(
            Authentication authentication, @PathVariable String id, @RequestBody ReviewLeaveRequestRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        return requestService.reject(caller.institutionId(), id, caller.id(), request);
    }

    @GetMapping("/balances")
    public List<LeaveRequestService.StaffLeaveBalances> listBalances(
            Authentication authentication, @RequestParam(required = false) Integer year) {
        int resolvedYear = year == null ? Year.now().getValue() : year;
        return requestService.listBalancesForInstitution(requireInstitutionId(authentication), resolvedYear);
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
