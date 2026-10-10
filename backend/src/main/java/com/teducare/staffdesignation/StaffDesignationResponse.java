package com.teducare.staffdesignation;

public record StaffDesignationResponse(
        String id,
        String name,
        String description,
        String category,
        String createdAt,
        String archivedAt) {

    public static StaffDesignationResponse from(StaffDesignation designation) {
        return new StaffDesignationResponse(
                designation.getId(),
                designation.getName(),
                designation.getDescription(),
                designation.getCategory(),
                designation.getCreatedAt().toString(),
                designation.getArchivedAt() == null ? null : designation.getArchivedAt().toString());
    }
}
