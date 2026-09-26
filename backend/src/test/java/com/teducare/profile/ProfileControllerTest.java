package com.teducare.profile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void superAdminProfileEndpointReturnsLiveProfileSummary() throws Exception {
        String token = loginAs("super_admin", "Super@2024");

        mockMvc.perform(get("/api/profile")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.email").value("ade.adetunji@turontech.com"))
                .andExpect(jsonPath("$.summary.institutionsCount").isNumber())
                .andExpect(jsonPath("$.summary.userManagerAccounts").isNumber());
    }

    @Test
    void institutionAdminProfileSummaryReportsRealInstitutionStatusNotAHardcodedLiteral() throws Exception {
        String token = loginAs("turon_admin", "Turon@2024");

        // XYZ College is a real, active seeded institution — this must come from
        // a live InstitutionRepository lookup, not a literal "active" string
        // (the "My Institution" card used to hardcode "Active" regardless).
        mockMvc.perform(get("/api/profile")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.institutionName").value("XYZ College of Technology"))
                .andExpect(jsonPath("$.summary.institutionStatus").value("active"))
                .andExpect(jsonPath("$.summary.menuKeysCount").isNumber());
    }

    @Test
    void passwordUpdateEndpointValidatesCurrentPassword() throws Exception {
        String token = loginAs("super_admin", "Super@2024");

        mockMvc.perform(patch("/api/profile/password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"wrong\",\"newPassword\":\"NewPass@2025\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void passwordUpdateEndpointSucceedsAndNewPasswordWorksOnNextLogin() throws Exception {
        String token = loginAs("turon_admin", "Turon@2024");

        mockMvc.perform(patch("/api/profile/password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"Turon@2024\",\"newPassword\":\"Turon@2025Updated\"}"))
                .andExpect(status().isOk());

        // Old password must be rejected now, and the new one must work.
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"turon_admin\",\"password\":\"Turon@2024\"}"))
                .andExpect(status().isUnauthorized());

        String newToken = loginAs("turon_admin", "Turon@2025Updated");

        // Restore the documented demo password — the account now lives in a real,
        // persistent database (not an in-memory map reset on every run), so this
        // test must leave it exactly as it found it for the next run.
        mockMvc.perform(patch("/api/profile/password")
                .header("Authorization", "Bearer " + newToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"Turon@2025Updated\",\"newPassword\":\"Turon@2024\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void profileUpdateEndpointPersistsChangesAndLeavesUnrelatedFieldsUntouched() throws Exception {
        String token = loginAs("amara_bello", "Amara@2024");

        mockMvc.perform(patch("/api/profile")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"phone\":\"08099998888\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.phone").value("08099998888"))
                .andExpect(jsonPath("$.profile.firstName").value("Amara"))
                .andExpect(jsonPath("$.profile.lastName").value("Bello"));

        mockMvc.perform(get("/api/profile")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.phone").value("08099998888"));
    }

    private String loginAs(String username, String password) throws Exception {
        String body = "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";

        String response = mockMvc
                .perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return response.split("\"token\":\"")[1].split("\"")[0];
    }
}
