package com.teducare.leave;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LeaveTypeService {

    private final LeaveTypeRepository repository;

    public LeaveTypeService(LeaveTypeRepository repository) {
        this.repository = repository;
    }

    public List<LeaveTypeResponse> list(String institutionId) {
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .map(LeaveTypeResponse::from)
                .toList();
    }

    public LeaveTypeResponse create(String institutionId, CreateLeaveTypeRequest request) {
        if (repository.existsByInstitutionIdAndNameIgnoreCaseAndArchivedAtIsNull(institutionId, request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A leave type with that name already exists.");
        }
        int defaultDays = request.defaultDaysPerYear() == null ? 0 : request.defaultDaysPerYear();
        boolean rollover = Boolean.TRUE.equals(request.rollover());
        validateDays(defaultDays);
        validateRollover(rollover, request.maxRolloverDays());

        LeaveType type = new LeaveType(
                "leavetype-" + UUID.randomUUID(),
                institutionId,
                request.name(),
                defaultDays,
                rollover,
                rollover ? request.maxRolloverDays() : null,
                Instant.now(),
                null);
        return LeaveTypeResponse.from(repository.save(type));
    }

    public LeaveTypeResponse update(String institutionId, String id, UpdateLeaveTypeRequest request) {
        LeaveType type = requireOwnType(institutionId, id);

        if (isPresent(request.name()) && !request.name().equalsIgnoreCase(type.getName())
                && repository.existsByInstitutionIdAndNameIgnoreCaseAndArchivedAtIsNull(institutionId, request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A leave type with that name already exists.");
        }
        if (isPresent(request.name())) {
            type.setName(request.name());
        }
        if (request.defaultDaysPerYear() != null) {
            validateDays(request.defaultDaysPerYear());
            type.setDefaultDaysPerYear(request.defaultDaysPerYear());
        }
        if (request.rollover() != null) {
            type.setRollover(request.rollover());
        }
        if (Boolean.TRUE.equals(request.clearMaxRolloverDays())) {
            type.setMaxRolloverDays(null);
        } else if (request.maxRolloverDays() != null) {
            type.setMaxRolloverDays(request.maxRolloverDays());
        }
        validateRollover(type.isRollover(), type.getMaxRolloverDays());

        return LeaveTypeResponse.from(repository.save(type));
    }

    public LeaveTypeResponse archive(String institutionId, String id) {
        LeaveType type = requireOwnType(institutionId, id);
        type.setArchivedAt(Instant.now());
        return LeaveTypeResponse.from(repository.save(type));
    }

    public LeaveTypeResponse restore(String institutionId, String id) {
        LeaveType type = requireOwnType(institutionId, id);
        type.setArchivedAt(null);
        return LeaveTypeResponse.from(repository.save(type));
    }

    LeaveType requireActiveType(String institutionId, String id) {
        LeaveType type = requireOwnType(institutionId, id);
        if (type.getArchivedAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This leave type is no longer active.");
        }
        return type;
    }

    /** Never leaks whether a leave type exists in a different institution — a mismatch reads identically to "not found". */
    private LeaveType requireOwnType(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave type not found."));
    }

    private static void validateDays(int days) {
        if (days < 0 || days > 365) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "defaultDaysPerYear must be between 0 and 365.");
        }
    }

    private static void validateRollover(boolean rollover, Integer maxRolloverDays) {
        if (rollover && maxRolloverDays != null && maxRolloverDays < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "maxRolloverDays cannot be negative.");
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}
