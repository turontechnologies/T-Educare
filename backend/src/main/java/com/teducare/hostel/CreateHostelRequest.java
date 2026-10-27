package com.teducare.hostel;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

/** {@code photoUrl} is set the same way every other avatar/logo/signature image is in this backend — upload the file through the generic {@code POST /uploads} (3.2) first, then pass the returned URL here. */
public record CreateHostelRequest(
        @NotBlank(message = "Hostel name is required.") String name,
        @NotEmpty(message = "At least one room is required.") @Valid List<HostelRoomRequest> rooms,
        String photoUrl) {
}
