package com.teducare.lecturer;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TimetableSlotRepository extends JpaRepository<TimetableSlot, String> {

    List<TimetableSlot> findByLectureAssignmentIdOrderByCreatedAtAsc(String lectureAssignmentId);

    Optional<TimetableSlot> findByIdAndLectureAssignmentId(String id, String lectureAssignmentId);

    void deleteByLectureAssignmentId(String lectureAssignmentId);
}
