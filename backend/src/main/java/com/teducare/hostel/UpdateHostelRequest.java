package com.teducare.hostel;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

/** Full replace, same as create — the rooms list is the new complete set, not a delta. A room no longer present is removed, unless it still holds an ALLOCATED student (409), matching {@code HostelService}'s guard. */
public record UpdateHostelRequest(
        @NotBlank(message = "Hostel name is required.") String name,
        @NotEmpty(message = "At least one room is required.") @Valid List<HostelRoomRequest> rooms,
        String photoUrl) {
}
