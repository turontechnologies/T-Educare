package com.teducare.auth;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserAccountRepository extends JpaRepository<UserAccount, String> {

    Optional<UserAccount> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    @Query("""
            select u from UserAccount u
            where u.role = 'institution_admin'
            and (:includeArchived = true or u.archivedAt is null)
            and (:institutionId is null or u.institutionId = :institutionId)
            and (:search is null
                 or lower(u.username) like lower(concat('%', :search, '%'))
                 or lower(u.email) like lower(concat('%', :search, '%'))
                 or lower(u.institutionName) like lower(concat('%', :search, '%')))
            order by u.createdAt desc
            """)
    Page<UserAccount> searchUserManagers(
            @Param("search") String search,
            @Param("includeArchived") boolean includeArchived,
            @Param("institutionId") String institutionId,
            Pageable pageable);

    /** Real count for the super admin profile summary (API_CONTRACT.md §3.1) — never hardcoded. */
    @Query("select count(u) from UserAccount u where u.role = 'institution_admin' and u.archivedAt is null")
    long countActiveUserManagers();
}
