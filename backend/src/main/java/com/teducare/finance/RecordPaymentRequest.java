package com.teducare.finance;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RecordPaymentRequest(
        @NotBlank(message = "Fee line is required.") String billLineId,
        @NotNull(message = "Amount is required.") @DecimalMin(value = "0.01", message = "Amount must be greater than 0.")
        BigDecimal amount,
        @NotBlank(message = "Payment method is required.") String method,
        String reference,
        @NotNull(message = "Payment date is required.") LocalDate paymentDate,
        String proofUrl) {
}
