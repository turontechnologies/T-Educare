package com.teducare.institution;

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

    @Query("select coalesce(sum(i.studentCount), 0) from Institution i where i.archivedAt is null")
    long sumActiveStudentCount();

    @Query("select coalesce(sum(i.revenue), 0) from Institution i where i.archivedAt is null")
    long sumActiveRevenue();

    @Query("select count(i) from Institution i where i.archivedAt is null and i.licenseKey is not null")
    long countLicensed();

    @Query("""
            select count(i) from Institution i
            where i.archivedAt is null and i.moduleKeys is not null and i.moduleKeys <> ''
            """)
    long countLinkedModules();
}
