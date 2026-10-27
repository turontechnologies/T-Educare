package com.teducare.courseresult;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

/** Each score is validated against the component's own weight (its max possible score) by {@code CourseResultService}, not a fixed annotation, since the max varies per component. */
public record SaveComponentScoresRequest(
        @NotEmpty(message = "At least one score is required.") @Valid List<StudentScoreEntry> scores) {
}
