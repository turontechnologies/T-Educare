package com.teducare.course;

import java.time.Instant;

public record CourseDepartmentOfferingResponse(
        String id,
        String courseId,
        String departmentId,
        Integer unitOverride,
        boolean compulsory,
        Instant createdAt) {

    static CourseDepartmentOfferingResponse from(CourseDepartmentOffering offering) {
        return new CourseDepartmentOfferingResponse(
                offering.getId(),
                offering.getCourseId(),
                offering.getDepartmentId(),
                offering.getUnitOverride(),
                offering.isCompulsory(),
                offering.getCreatedAt());
    }
}
