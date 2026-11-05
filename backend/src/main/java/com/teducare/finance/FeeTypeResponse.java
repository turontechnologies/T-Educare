package com.teducare.finance;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/** {@code departmentName}/{@code levelCode} are {@code null} when the fee applies to "All programmes"/"All levels" — the frontend renders that fallback text itself. */
public record FeeTypeResponse(
        String id,
        String code,
        String name,
        String departmentId,
        String departmentName,
        String programLevelId,
        String levelCode,
        String academicSessionId,
        String sessionLabel,
        BigDecimal amount,
        LocalDate dueDate,
        String latePenaltyType,
        BigDecimal latePenaltyValue,
        int studentsBilled,
        Instant createdAt) {
}
