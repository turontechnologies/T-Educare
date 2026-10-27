package com.teducare.hostel;

import java.time.Instant;
import java.util.List;

/** {@code occupiedCount}/room-level {@code occupiedCount} count only ALLOCATED students — a PENDING_ALLOCATION's tentative room pick doesn't reserve a bedspace, matching the reference design's free-space counts exactly. */
public record HostelResponse(
        String id,
        String name,
        String photoUrl,
        int totalRooms,
        int totalBedspaces,
        int occupiedCount,
        List<HostelRoomResponse> rooms,
        Instant createdAt) {
}
