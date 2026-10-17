package com.teducare.attendance;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

/**
 * A staff member's own attendance — {@code staffId} is always resolved from
 * the caller's own session (their account's {@code staffId} link), never
 * accepted from the client, so one staff member can never read another's
 * clock-in/clock-out times. See API_CONTRACT.md — "every staff will see
 * only their own time clock in and out."
 */
@RestController
@RequestMapping("/api/attendance/my")
public class AttendanceSelfServiceController {

    private final AttendanceService service;
    private final AuthDirectory authDirectory;

    public AttendanceSelfServiceController(AttendanceService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping("/history")
    public List<DailyAttendanceEntry> getMyHistory(
            Authentication authentication, @RequestParam String from, @RequestParam String to) {
        AuthenticatedUserDto caller = requireStaffCaller(authentication);
        return service.getMyHistory(caller.institutionId(), caller.staffId(), LocalDate.parse(from), LocalDate.parse(to));
    }

    @GetMapping("/today")
    public List<DailyAttendanceEntry> getMyToday(Authentication authentication) {
        AuthenticatedUserDto caller = requireStaffCaller(authentication);
        LocalDate today = LocalDate.now();
        return service.getMyHistory(caller.institutionId(), caller.staffId(), today, today);
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
