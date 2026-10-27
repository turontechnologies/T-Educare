package com.teducare.announcement;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One file attached to an {@link Announcement} — uploaded via the existing generic {@code POST /uploads} (3.2), same pattern as every other file in this backend; {@code fileSizeBytes} is client-reported at creation time, same as every other upload flow here (no server-side file inspection exists anywhere in this app). */
@Entity
@Table(name = "announcement_attachments", schema = "dbo")
public class AnnouncementAttachment {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "announcement_id", nullable = false, length = 64)
    private String announcementId;

    @Column(name = "file_name", nullable = false, length = 300)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "file_size_bytes", nullable = false)
    private long fileSizeBytes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AnnouncementAttachment() {
    }

    public AnnouncementAttachment(
            String id, String announcementId, String fileName, String fileUrl, long fileSizeBytes, Instant createdAt) {
        this.id = id;
        this.announcementId = announcementId;
        this.fileName = fileName;
        this.fileUrl = fileUrl;
        this.fileSizeBytes = fileSizeBytes;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getAnnouncementId() {
        return announcementId;
    }

    public String getFileName() {
        return fileName;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
