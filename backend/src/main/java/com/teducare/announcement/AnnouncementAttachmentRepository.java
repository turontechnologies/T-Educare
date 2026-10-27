package com.teducare.announcement;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementAttachmentRepository extends JpaRepository<AnnouncementAttachment, String> {

    List<AnnouncementAttachment> findByAnnouncementIdOrderByCreatedAtAsc(String announcementId);

    void deleteByAnnouncementId(String announcementId);
}
