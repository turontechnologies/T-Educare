package com.teducare.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/** {@code fileUrl} comes from uploading through the existing generic {@code POST /uploads} (3.2) first. */
public record AttachmentRequest(
        @NotBlank(message = "File name is required.") String fileName,
        @NotBlank(message = "File URL is required.") String fileUrl,
        @NotNull(message = "File size is required.") @PositiveOrZero(message = "File size can't be negative.")
        Long fileSizeBytes) {
}
