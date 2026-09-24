package com.teducare.usermanager;

import jakarta.validation.constraints.NotBlank;

public record UserManagerStatusRequest(
        @NotBlank(message = "Status is required.") String status) {
}
