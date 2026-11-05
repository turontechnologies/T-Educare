package com.teducare.finance;

import java.math.BigDecimal;
import java.time.Instant;

public record FinanceTransactionLogResponse(
        String id,
        String eventType,
        String studentMatricNo,
        String studentName,
        BigDecimal amount,
        String reference,
        String details,
        String recordedByName,
        Instant createdAt) {
}
