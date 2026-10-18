package com.teducare.institution;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InstitutionRepository extends JpaRepository<Institution, String> {

    @Query("""
            select i from Institution i
            where (:includeArchived = true or i.archivedAt is null)
            and (:search is null
                 or lower(i.name) like lower(concat('%', :search, '%'))
                 or lower(i.adminUser) like lower(concat('%', :search, '%')))
            and (:unlinkedOnly = false or i.moduleKeys is null or i.moduleKeys = '')
            and (:unlicensedOnly = false or i.licenseKey is null)
            order by i.createdAt desc
            """)
    Page<Institution> search(
            @Param("search") String search,
            @Param("includeArchived") boolean includeArchived,
            @Param("unlinkedOnly") boolean unlinkedOnly,
            @Param("unlicensedOnly") boolean unlicensedOnly,
            Pageable pageable);

    /** Real, platform-wide aggregates for the super admin dashboard/profile summary (API_CONTRACT.md §9.4, §3.1) — never hardcoded. */
    @Query("select count(i) from Institution i where i.archivedAt is null")
    long countActive();

    @Query("select count(i) from Institution i where i.archivedAt is null and i.licenseKey is not null")
    long countLicensed();

    @Query("""
            select count(i) from Institution i
            where i.archivedAt is null and i.moduleKeys is not null and i.moduleKeys <> ''
            """)
    long countLinkedModules();

    /** Drives the scheduled sweep (LicenseSweepScheduler) — every institution whose grace period has lapsed. */
    List<Institution> findByLicenseStatusAndGraceEndsAtBefore(String licenseStatus, Instant cutoff);

    boolean existsByCode(String code);

    /**
     * The highest numeric `code` currently in use, or null if none exist —
     * the real next-code seed. {@code TRY_CAST} returns null (not an error)
     * for any non-numeric code, so {@code MAX} silently ignores those rather
     * than failing; nothing currently generates a non-numeric code, but this
     * stays correct if that ever changes. Deliberately NOT {@code count()}:
     * that used to seed the next code (`count() + 1`) and broke the moment
     * row count could ever decrease — a bulk cleanup of archived institutions
     * dropped the count far below the highest code already issued, so new
     * institutions started generating already-taken codes and hit `code`'s
     * UNIQUE constraint with a 500. Row count was never the right source for
     * "next sequence number" in the first place.
     */
    @Query(value = "SELECT MAX(TRY_CAST(code AS INT)) FROM dbo.institutions", nativeQuery = true)
    Integer maxNumericCode();
}
