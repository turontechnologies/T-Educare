package com.teducare.hostel;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HostelRoomRepository extends JpaRepository<HostelRoom, String> {

    List<HostelRoom> findByHostelIdOrderByCreatedAtAsc(String hostelId);

    Optional<HostelRoom> findByIdAndHostelId(String id, String hostelId);

    void deleteByHostelId(String hostelId);
}
