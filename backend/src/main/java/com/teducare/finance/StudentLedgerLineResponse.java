package com.teducare.finance;

import java.math.BigDecimal;
import java.time.LocalDate;

/** {@code payment} is {@code null} when nothing has been paid against this specific line yet (renders as a blank cell, matching the reference ledger table); {@code lineBalance} is this line's own remaining due amount ("Status" column). */
public record StudentLedgerLineResponse(
        String id,
        LocalDate date,
        String description,
        String reference,
        BigDecimal charge,
        BigDecimal payment,
        BigDecimal runningBalance,
        BigDecimal lineBalance,
        String lineType) {
}
