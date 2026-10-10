package com.teducare.staff;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffMemberRepository extends JpaRepository<StaffMember, String> {

    List<StaffMember> findByInstitutionIdOrderByCreatedAtAsc(String institutionId);

    Optional<StaffMember> findByIdAndInstitutionId(String id, String institutionId);
}
