package com.teducare.institution;

import java.time.Instant;
import java.util.List;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Seeds a small set of demo institutions once, if the table is empty.
 * "inst-xyz-college" and "inst-ahmadubellouniversit-1" reuse the exact ids
 * already referenced by the turon_admin/amara_bello login accounts
 * (see auth/DemoAccountSeeder) so both stay consistent once this is wired
 * to the frontend.
 */
@Component
public class DemoInstitutionSeeder {

    private final InstitutionRepository repository;

    public DemoInstitutionSeeder(InstitutionRepository repository) {
        this.repository = repository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedDemoInstitutions() {
        if (repository.count() > 0) {
            return;
        }

        repository.saveAll(List.of(
                new Institution(
                        "inst-xyz-college", "001", "XYZ College of Technology", "University",
                        "12 Independence Way", "Owerri", "Nigeria - Imo State",
                        "Mr John Bassey", "john.bassey@xyzcollege.edu.ng", "08031234567",
                        "James Keen", "james.keen@xyzcollege.edu.ng", null,
                        null, null, 0, 90, 120000L,
                        "Basic", null, "TK4F-8H2K-9P1Q-XZ3M", null, null,
                        "active", Instant.parse("2026-03-03T14:32:00.000Z"), null),
                new Institution(
                        "inst-ahmadubellouniversit-1", "002", "Ahmadu Bello University", "University",
                        "11 University Road", "Zaria", "Nigeria - Kaduna State",
                        "Prof. Tunde Ogundele", "tunde.ogundele@ahmadubellouni.edu.ng", "08031234567",
                        "Solomon Okafor", "solomon.okafor@ahmadubellouni.edu.ng", null,
                        null, null, 0, 47, 43300L,
                        "Premium", Instant.parse("2027-03-02T23:00:00.000Z"), "REZL-R88N-L1KD-GW3X", null, null,
                        "active", Instant.parse("2026-03-03T08:07:00.000Z"), null),
                new Institution(
                        "inst-babcock", "003", "Babcock University", "University",
                        "PMB 4003", "Ilishan-Remo", "Nigeria - Ogun State",
                        "Mr Chris Smart", "chris-smart@gmail.com", "08025771099",
                        "Solomon Akpo", "solomon.odogun@gmail.com", null,
                        null, null, 0, 70, 85000L,
                        "Premium", Instant.parse("2027-03-03T00:00:00.000Z"), "TK7B-2N5R-6V8W-LQ1D", null, null,
                        "active", Instant.parse("2026-03-03T11:13:00.000Z"), null),
                new Institution(
                        "inst-ibadan", "004", "University of Ibadan", "University",
                        "Ibadan-Ife Road", "Ibadan", "Nigeria - Oyo State",
                        "Mrs Funmi Adeyemi", "funmi.adeyemi@ui.edu.ng", "08039876543",
                        "Stanly Hip", "stanly.hip@ui.edu.ng", null,
                        null, null, 0, 50, 50000L,
                        "Premium", Instant.parse("2027-03-03T00:00:00.000Z"), "TK2Y-9J4C-3E7T-RM6S", null, null,
                        "inactive", Instant.parse("2026-03-03T09:15:00.000Z"), null),
                new Institution(
                        "inst-universityoflagos-0", "005", "University of Lagos", "University",
                        "10 Independence Way", "Lagos", "Nigeria - Lagos State",
                        "Prof. Amara Okafor", "amara.okafor@universityofla.edu.ng", "08030000000",
                        "James Akpo", "james.akpo@universityofla.edu.ng", null,
                        null, null, 0, 30, 32000L,
                        "Standard", Instant.parse("2027-03-04T00:00:00.000Z"), "0V6U-E6JB-PL25-D1ZC", null, null,
                        "active", Instant.parse("2026-03-03T07:00:00.000Z"), null)));
    }
}
