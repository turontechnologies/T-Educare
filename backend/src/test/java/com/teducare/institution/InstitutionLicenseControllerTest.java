package com.teducare.institution;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class InstitutionLicenseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private InstitutionService institutionService;

    @Test
    void gracePeriodLifecycleStartThenRenewRecordsBothEventsNewestFirst() throws Exception {
        String token = loginAs("super_admin", "Super@2024");
        String id = createInstitution(token, "Grace Lifecycle University", "admin@gracelifecycle.edu.ng");

        try {
            mockMvc.perform(post("/api/institutions/" + id + "/start-grace-period")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\":\"Payment default.\",\"graceDays\":10}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.licenseStatus").value("GRACE_PERIOD"))
                    .andExpect(jsonPath("$.graceEndsAt").exists());

            mockMvc.perform(get("/api/institutions/" + id + "/license-events")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].eventType").value("GRACE_STARTED"))
                    .andExpect(jsonPath("$[0].reason").value("Payment default."));

            mockMvc.perform(post("/api/institutions/" + id + "/renew-license")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\":\"Payment received.\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.licenseStatus").value("ACTIVE"))
                    .andExpect(jsonPath("$.graceEndsAt").doesNotExist());

            mockMvc.perform(get("/api/institutions/" + id + "/license-events")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].eventType").value("RENEWED"))
                    .andExpect(jsonPath("$[1].eventType").value("GRACE_STARTED"));
        } finally {
            mockMvc.perform(post("/api/institutions/" + id + "/archive")
                    .header("Authorization", "Bearer " + token));
        }
    }

    @Test
    void sweepSuspendsLapsedGracePeriodsAndRecordsSystemActor() throws Exception {
        String token = loginAs("super_admin", "Super@2024");
        String id = createInstitution(token, "Sweep Target University", "admin@sweeptarget.edu.ng");

        try {
            mockMvc.perform(post("/api/institutions/" + id + "/start-grace-period")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\":\"Payment default.\"}"))
                    .andExpect(status().isOk());

            // Force the grace deadline into the past so the sweep picks it up
            // without waiting on real wall-clock time.
            Institution institution = institutionRepository.findById(id).orElseThrow();
            institution.setGraceEndsAt(Instant.now().minusSeconds(60));
            institutionRepository.save(institution);

            int sweptCount = institutionService.sweepExpiredGracePeriods();
            assertTrue(sweptCount >= 1);

            mockMvc.perform(get("/api/institutions/" + id)
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.licenseStatus").value("SUSPENDED"))
                    .andExpect(jsonPath("$.graceEndsAt").doesNotExist());

            mockMvc.perform(get("/api/institutions/" + id + "/license-events")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].eventType").value("SUSPENDED"))
                    .andExpect(jsonPath("$[0].actorId").value("SYSTEM"));
        } finally {
            mockMvc.perform(post("/api/institutions/" + id + "/archive")
                    .header("Authorization", "Bearer " + token));
        }
    }

    @Test
    void suspendedLicenseBlocksLoginButLeavesStatusCheckUnaffected() throws Exception {
        Institution institution = institutionRepository.findById("inst-xyz-college").orElseThrow();
        assertEquals("ACTIVE", institution.getLicenseStatus());

        institution.setLicenseStatus("SUSPENDED");
        institutionRepository.save(institution);

        try {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"turon_admin\",\"password\":\"Turon@2024\"}"))
                    .andExpect(status().isUnauthorized());
        } finally {
            institution = institutionRepository.findById("inst-xyz-college").orElseThrow();
            institution.setLicenseStatus("ACTIVE");
            institutionRepository.save(institution);
        }

        // Proves login works again once restored — the suspension check isn't stuck on.
        loginAs("turon_admin", "Turon@2024");
    }

    @Test
    void nonSuperAdminCannotManageLicenseStatus() throws Exception {
        String token = loginAs("turon_admin", "Turon@2024");

        mockMvc.perform(post("/api/institutions/inst-ahmadubellouniversit-1/start-grace-period")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"Payment default.\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/institutions/inst-ahmadubellouniversit-1/renew-license")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/institutions/inst-ahmadubellouniversit-1/suspend-license")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"Fraud investigation.\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/institutions/inst-ahmadubellouniversit-1/license-events")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void suspendLicenseIsImmediateFromActiveAndDistinguishesItselfFromTheAutomatedSweep() throws Exception {
        String token = loginAs("super_admin", "Super@2024");
        String id = createInstitution(token, "Immediate Suspend University", "admin@immediatesuspend.edu.ng");

        try {
            mockMvc.perform(post("/api/institutions/" + id + "/suspend-license")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\":\"Fraud investigation.\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.licenseStatus").value("SUSPENDED"))
                    .andExpect(jsonPath("$.graceEndsAt").doesNotExist());

            mockMvc.perform(post("/api/institutions/" + id + "/suspend-license")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\":\"\"}"))
                    .andExpect(status().isBadRequest());

            mockMvc.perform(get("/api/institutions/" + id + "/license-events")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].eventType").value("SUSPENDED"))
                    .andExpect(jsonPath("$[0].reason").value("Fraud investigation."))
                    .andExpect(jsonPath("$[0].actorId").value(org.hamcrest.Matchers.not("SYSTEM")));
        } finally {
            mockMvc.perform(post("/api/institutions/" + id + "/archive")
                    .header("Authorization", "Bearer " + token));
        }
    }

    @Test
    void revokingLicenseResetsLicenseStatusBackToActiveEvenFromSuspended() throws Exception {
        String token = loginAs("super_admin", "Super@2024");
        String id = createInstitution(token, "Revoke Reset University", "admin@revokereset.edu.ng");

        try {
            mockMvc.perform(post("/api/institutions/" + id + "/start-grace-period")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"reason\":\"Payment default.\"}"))
                    .andExpect(status().isOk());

            Institution institution = institutionRepository.findById(id).orElseThrow();
            institution.setLicenseStatus("SUSPENDED");
            institution.setGraceEndsAt(null);
            institutionRepository.save(institution);

            mockMvc.perform(post("/api/institutions/" + id + "/revoke-license")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.licenseType").value("Basic"))
                    .andExpect(jsonPath("$.licenseStatus").value("ACTIVE"))
                    .andExpect(jsonPath("$.graceEndsAt").doesNotExist());
        } finally {
            mockMvc.perform(post("/api/institutions/" + id + "/archive")
                    .header("Authorization", "Bearer " + token));
        }
    }

    private String createInstitution(String token, String name, String adminEmail) throws Exception {
        String response = mockMvc.perform(post("/api/institutions")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"%s","institutionType":"University",
                         "adminUser":"Test Admin","adminEmail":"%s"}
                        """.formatted(name, adminEmail)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String loginAs(String username, String password) throws Exception {
        String body = "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";

        String response = mockMvc
                .perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return response.split("\"token\":\"")[1].split("\"")[0];
    }
}
