package com.teducare.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, String> {

    /**
     * Every caller gets their own "user"-scope rows, plus "institution"-scope
     * rows for their own institution (institution admins only — institutionId
     * is null for a super admin, and a null-valued equality never matches, so
     * this clause is naturally a no-op for them), plus every "platform"-scope
     * row if they're a super admin. Mirrors API_CONTRACT.md §10.1 exactly.
     */
    @Query("""
            select n from Notification n
            where (n.scopeType = 'user' and n.scopeUserId = :callerId)
               or (n.scopeType = 'institution' and n.scopeInstitutionId = :institutionId)
               or (:isSuperAdmin = true and n.scopeType = 'platform')
            order by n.createdAt desc
            """)
    Page<Notification> findInScope(
            @Param("callerId") String callerId,
            @Param("isSuperAdmin") boolean isSuperAdmin,
            @Param("institutionId") String institutionId,
            Pageable pageable);

    @Query("""
            select count(n) from Notification n
            where n.read = false
            and ((n.scopeType = 'user' and n.scopeUserId = :callerId)
               or (n.scopeType = 'institution' and n.scopeInstitutionId = :institutionId)
               or (:isSuperAdmin = true and n.scopeType = 'platform'))
            """)
    long countUnreadInScope(
            @Param("callerId") String callerId,
            @Param("isSuperAdmin") boolean isSuperAdmin,
            @Param("institutionId") String institutionId);

    @Modifying
    @Query("""
            update Notification n set n.read = true
            where n.read = false
            and ((n.scopeType = 'user' and n.scopeUserId = :callerId)
               or (n.scopeType = 'institution' and n.scopeInstitutionId = :institutionId)
               or (:isSuperAdmin = true and n.scopeType = 'platform'))
            """)
    void markAllReadInScope(
            @Param("callerId") String callerId,
            @Param("isSuperAdmin") boolean isSuperAdmin,
            @Param("institutionId") String institutionId);
}
