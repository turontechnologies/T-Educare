package com.teducare.elective;

import java.time.Instant;
import java.util.List;

public record ElectiveGroupResponse(
        String id,
        String departmentId,
        String programLevelId,
        String name,
        int minSelect,
        int maxSelect,
        List<String> courseIds,
        Instant createdAt,
        Instant archivedAt) {

    static ElectiveGroupResponse from(ElectiveGroup group) {
        return new ElectiveGroupResponse(
                group.getId(),
                group.getDepartmentId(),
                group.getProgramLevelId(),
                group.getName(),
                group.getMinSelect(),
                group.getMaxSelect(),
                splitCourseIds(group.getCourseIds()),
                group.getCreatedAt(),
                group.getArchivedAt());
    }

    private static List<String> splitCourseIds(String csv) {
        return (csv == null || csv.isBlank()) ? List.of() : List.of(csv.split(","));
    }
}
