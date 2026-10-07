package com.teducare.coursegrade;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CourseGradeService {

    private final CourseGradeRepository repository;

    public CourseGradeService(CourseGradeRepository repository) {
        this.repository = repository;
    }

    public List<CourseGradeResponse> list(String institutionId, boolean includeArchived) {
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(grade -> includeArchived || grade.getArchivedAt() == null)
                .map(CourseGradeResponse::from)
                .toList();
    }

    public CourseGradeResponse create(String institutionId, CreateCourseGradeRequest request) {
        validateScoreRange(request.minimumScore(), request.maximumScore());
        validateUniqueCode(institutionId, request.code(), null);

        CourseGrade grade = new CourseGrade(
                "course-grade-" + UUID.randomUUID(),
                institutionId,
                request.code(),
                request.remark(),
                request.gradeScore(),
                request.minimumScore(),
                request.maximumScore(),
                Instant.now(),
                null);
        return CourseGradeResponse.from(repository.save(grade));
    }

    public CourseGradeResponse update(String institutionId, String id, UpdateCourseGradeRequest request) {
        CourseGrade grade = requireOwnCourseGrade(institutionId, id);

        BigDecimal newMin = request.minimumScore() != null ? request.minimumScore() : grade.getMinimumScore();
        BigDecimal newMax = request.maximumScore() != null ? request.maximumScore() : grade.getMaximumScore();
        validateScoreRange(newMin, newMax);

        if (isPresent(request.code())) {
            validateUniqueCode(institutionId, request.code(), id);
            grade.setCode(request.code());
        }
        if (isPresent(request.remark())) {
            grade.setRemark(request.remark());
        }
        if (request.gradeScore() != null) {
            grade.setGradeScore(request.gradeScore());
        }
        grade.setMinimumScore(newMin);
        grade.setMaximumScore(newMax);

        return CourseGradeResponse.from(repository.save(grade));
    }

    public CourseGradeResponse archive(String institutionId, String id) {
        CourseGrade grade = requireOwnCourseGrade(institutionId, id);
        grade.setArchivedAt(Instant.now());
        return CourseGradeResponse.from(repository.save(grade));
    }

    public CourseGradeResponse restore(String institutionId, String id) {
        CourseGrade grade = requireOwnCourseGrade(institutionId, id);
        grade.setArchivedAt(null);
        return CourseGradeResponse.from(repository.save(grade));
    }

    /** Never leaks whether a course grade exists in a different institution — a mismatch reads identically to "not found". */
    private CourseGrade requireOwnCourseGrade(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course grade not found."));
    }

    private void validateScoreRange(BigDecimal minimumScore, BigDecimal maximumScore) {
        if (maximumScore.compareTo(minimumScore) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum score must be greater than minimum score.");
        }
    }

    private void validateUniqueCode(String institutionId, String code, String excludingId) {
        boolean collides = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .anyMatch(existing -> existing.getArchivedAt() == null
                        && !existing.getId().equals(excludingId)
                        && existing.getCode().equalsIgnoreCase(code));
        if (collides) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A course grade with that code already exists.");
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}
