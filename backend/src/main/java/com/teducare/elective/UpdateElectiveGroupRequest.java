package com.teducare.elective;

import java.util.List;

/** Any field left null keeps its current value — same partial-update convention as every other resource in this app. */
public record UpdateElectiveGroupRequest(
        String departmentId,
        String programLevelId,
        String name,
        Integer minSelect,
        Integer maxSelect,
        List<String> courseIds) {
}
