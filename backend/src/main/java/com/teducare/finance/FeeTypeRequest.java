package com.teducare.finance;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Shared create/update shape — {@code departmentId}/{@code programLevelId} blank or omitted means "All programmes"/"All levels". */
public record FeeTypeRequest(
        @NotBlank(message = "Fee name is required.") String name,
        String departmentId,
        String programLevelId,
        @NotBlank(message = "Academic session is required.") String academicSessionId,
        @NotNull(message = "Amount is required.") @DecimalMin(value = "0.01", message = "Amount must be greater than 0.")
        BigDecimal amount,
        @NotNull(message = "Due date is required.") LocalDate dueDate,
        @NotBlank(message = "Late penalty type is required.") String latePenaltyType,
        BigDecimal latePenaltyValue) {
}
