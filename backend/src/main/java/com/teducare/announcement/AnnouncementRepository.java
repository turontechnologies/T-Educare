package com.teducare.announcement;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementRepository extends JpaRepository<Announcement, String> {

    List<Announcement> findByInstitutionIdOrderByCreatedAtDesc(String institutionId);

    Optional<Announcement> findByIdAndInstitutionId(String id, String institutionId);
}
