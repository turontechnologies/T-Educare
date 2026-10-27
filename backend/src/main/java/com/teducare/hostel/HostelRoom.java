package com.teducare.hostel;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One room within a {@link Hostel} — its own bedspace capacity, independently tracked so occupancy/free-space math can be shown per room, not just per hostel. */
@Entity
@Table(name = "hostel_rooms", schema = "dbo")
public class HostelRoom {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "hostel_id", nullable = false, length = 64)
    private String hostelId;

    @Column(name = "room_number", nullable = false, length = 50)
    private String roomNumber;

    @Column(name = "capacity", nullable = false)
    private int capacity;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected HostelRoom() {
    }

    public HostelRoom(String id, String hostelId, String roomNumber, int capacity, Instant createdAt) {
        this.id = id;
        this.hostelId = hostelId;
        this.roomNumber = roomNumber;
        this.capacity = capacity;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getHostelId() {
        return hostelId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public int getCapacity() {
        return capacity;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
