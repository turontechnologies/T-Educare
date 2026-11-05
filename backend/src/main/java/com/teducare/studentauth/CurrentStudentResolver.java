package com.teducare.studentauth;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import io.jsonwebtoken.Claims;

/**
 * Every Student Portal data controller (academic summary, hostel status, My
 * Bills, …) calls {@link #require} instead of the staff-side
 * AuthDirectory/AuthenticatedUserDto path — a Student is not a UserAccount,
 * so its identity lives only in the JWT's own claims, attached to
 * {@code Authentication.getDetails()} by JwtAuthenticationFilter.
 */
@Component
public class CurrentStudentResolver {

    public CurrentStudent require(Authentication authentication) {
        if (authentication == null || !(authentication.getDetails() instanceof Claims claims)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        Object role = claims.get("role");
        Object studentId = claims.get("studentId");
        Object institutionId = claims.get("institutionId");
        if (!"student".equals(role) || studentId == null || institutionId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Student access required.");
        }

        return new CurrentStudent(studentId.toString(), institutionId.toString());
    }
}
