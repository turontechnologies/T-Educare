package com.teducare.announcement;

public record AttachmentResponse(String id, String fileName, String fileUrl, long fileSizeBytes) {

    static AttachmentResponse from(AnnouncementAttachment attachment) {
        return new AttachmentResponse(
                attachment.getId(), attachment.getFileName(), attachment.getFileUrl(), attachment.getFileSizeBytes());
    }
}
