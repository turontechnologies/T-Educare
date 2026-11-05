package com.teducare.finance;

import java.math.BigDecimal;

public record RunPayrollResultResponse(int staffPaid, int staffOnHold, BigDecimal netPayroll) {
}
