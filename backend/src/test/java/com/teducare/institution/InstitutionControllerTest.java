package com.teducare.institution;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class InstitutionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void institutionAdminSeesOnlyOwnInstitutionNeverTheFullList() throws Exception {
        String token = loginAs("turon_admin", "Turon@2024");

        // Fixed a real bug here: this used to 403 outright, which silently
        // broke dashboard/layout.tsx's and role-dialog.tsx's own fetch of
        // this same endpoint (both rely on it to resolve their own
        // institution's live moduleKeys/name/logo) — every institution_admin
        // session was resolving an empty moduleKeys list, gating their whole
        // nav down to nothing. Now scoped to a single-row view instead of a
        // blanket 403, but still never the full platform list (§1's
        // multi-tenancy rule) — see the two-or-more-institutions super admin
        // assertion below.
        mockMvc.perform(get("/api/institutions")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value("inst-xyz-college"))
                .andExpect(jsonPath("$.meta.total").value(1));
    }

    @Test
    void listReturnsSeededInstitutionsForSuperAdmin() throws Exception {
        String token = loginAs("super_admin", "Super@2024");

        mockMvc.perform(get("/api/institutions")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.meta.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(5)));
    }

    @Test
    void searchFiltersByNameOrAdminUser() throws Exception {
        String token = loginAs("super_admin", "Super@2024");

        mockMvc.perform(get("/api/institutions")
                .param("search", "Babcock")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].name").value("Babcock University"));
    }

    @Test
    void createAppliesDocumentedDefaults() throws Exception {
        String token = loginAs("super_admin", "Super@2024");

        String response = mockMvc.perform(post("/api/institutions")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Covenant University","institutionType":"University",
                         "adminUser":"Ngozi Eze","adminEmail":"admin@covenantuniversity.edu.ng"}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Covenant University"))
                .andExpect(jsonPath("$.modulesCount").value(0))
                .andExpect(jsonPath("$.licenseType").value("Basic"))
                .andExpect(jsonPath("$.status").value("active"))
                .andExpect(jsonPath("$.licenseKey").doesNotExist())
                .andExpect(jsonPath("$.code").exists())
                .andExpect(jsonPath("$.tokenKey").exists())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String createdId = response.split("\"id\":\"")[1].split("\"")[0];

        // There's no hard-delete endpoint (by design, see API_CONTRACT.md §4.4) —
        // archive it so repeated runs against this same persistent DB don't pile up
        // duplicate "active" institutions.
        mockMvc.perform(post("/api/institutions/" + createdId + "/archive")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void updateStatusArchiveAndRestoreRoundTrip() throws Exception {
        String token = loginAs("super_admin", "Super@2024");

        mockMvc.perform(patch("/api/institutions/inst-ibadan/status")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"active\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("active"));

        mockMvc.perform(post("/api/institutions/inst-ibadan/archive")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").exists());

        mockMvc.perform(get("/api/institutions")
                .param("search", "Ibadan")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));

        mockMvc.perform(get("/api/institutions")
                .param("search", "Ibadan")
                .param("includeArchived", "true")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));

        mockMvc.perform(post("/api/institutions/inst-ibadan/restore")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivedAt").doesNotExist());
    }

    @Test
    void linkModulesActivatesInstitutionAndCanBeFilteredByUnlinkedOnly() throws Exception {
        String token = loginAs("super_admin", "Super@2024");

        // Fresh institution so this test doesn't perturb any other test's
        // assumptions about existing seeded/created institutions.
        String createResponse = mockMvc.perform(post("/api/institutions")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Module Test University","institutionType":"University",
                         "adminUser":"Test Admin","adminEmail":"admin@moduletestuniversity.edu.ng"}
                        """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String id = createResponse.split("\"id\":\"")[1].split("\"")[0];

        try {
            // Deactivated first, to prove linking modules re-activates it —
            // the documented side effect (API_CONTRACT.md §4.6.2).
            mockMvc.perform(patch("/api/institutions/" + id + "/status")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"inactive\"}"))
                    .andExpect(status().isOk());

            // Unlinked (moduleKeys empty) — must show up under unlinkedOnly.
            mockMvc.perform(get("/api/institutions")
                    .param("unlinkedOnly", "true")
                    .param("search", "Module Test University")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(1));

            mockMvc.perform(patch("/api/institutions/" + id + "/modules")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"moduleKeys\":[\"payment\",\"students\",\"exams\"]}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.moduleKeys.length()").value(3))
                    .andExpect(jsonPath("$.moduleKeys[0]").value("payment"))
                    .andExpect(jsonPath("$.modulesCount").value(3))
                    .andExpect(jsonPath("$.modulesLastEditedAt").exists())
                    .andExpect(jsonPath("$.status").value("active"));

            // Now linked — must disappear from unlinkedOnly.
            mockMvc.perform(get("/api/institutions")
                    .param("unlinkedOnly", "true")
                    .param("search", "Module Test University")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(0));

            mockMvc.perform(patch("/api/institutions/" + id + "/modules")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"moduleKeys\":[\"not-a-real-module\"]}"))
                    .andExpect(status().isBadRequest());
        } finally {
            // No hard-delete exists (same convention as every other resource
            // in this app) — archive so repeated runs don't pile up.
            mockMvc.perform(post("/api/institutions/" + id + "/archive")
                    .header("Authorization", "Bearer " + token));
        }
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
