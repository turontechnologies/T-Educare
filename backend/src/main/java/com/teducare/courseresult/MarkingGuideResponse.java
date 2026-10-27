package com.teducare.courseresult;

import java.math.BigDecimal;
import java.util.List;

public record MarkingGuideResponse(String name, List<MarkingGuideComponentResponse> components, BigDecimal totalWeight) {
}
