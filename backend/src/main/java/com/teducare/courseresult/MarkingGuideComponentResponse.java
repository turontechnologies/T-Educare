package com.teducare.courseresult;

import java.math.BigDecimal;

public record MarkingGuideComponentResponse(String id, String name, BigDecimal weight) {

    static MarkingGuideComponentResponse from(MarkingGuideComponent component) {
        return new MarkingGuideComponentResponse(component.getId(), component.getName(), component.getWeight());
    }
}
