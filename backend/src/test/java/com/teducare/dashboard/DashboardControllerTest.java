package com.teducare.dashboard;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void superAdminStatsEndpointReturnsSummary() throws Exception {
        String token = loginAs("super_admin", "Super@2024");

        mockMvc.perform(get("/api/super-admin/stats")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.institutionsCount").value(27))
                .andExpect(jsonPath("$.totalStudents").value(5622))
                .andExpect(jsonPath("$.totalRevenue").value(1528600));
    }

    @Test
    void institutionAdminDashboardStatsReadRealPerInstitutionColumnsAndZeroWhatHasNoBackendYet() throws Exception {
        String turonToken = loginAs("turon_admin", "Turon@2024");
        String amaraToken = loginAs("amara_bello", "Amara@2024");

        // Real, seeded per-institution values (Institution.studentCount/revenue —
        // see DemoInstitutionSeeder) — differ by institution because they're
        // read live from the real row, not a hardcoded switch statement.
        mockMvc.perform(get("/api/dashboard/stats")
                .header("Authorization", "Bearer " + turonToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registeredStudents").value(90))
                .andExpect(jsonPath("$.accumulatedProfit").value(120000))
                .andExpect(jsonPath("$.applicants").value(0))
                .andExpect(jsonPath("$.lecturers").value(0));

        mockMvc.perform(get("/api/dashboard/stats")
                .header("Authorization", "Bearer " + amaraToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registeredStudents").value(47))
                .andExpect(jsonPath("$.accumulatedProfit").value(43300))
                .andExpect(jsonPath("$.applicants").value(0))
                .andExpect(jsonPath("$.lecturers").value(0));
    }

    @Test
    void enrollmentAndRecentStudentsAreHonestlyEmptyRatherThanFabricated() throws Exception {
        String token = loginAs("turon_admin", "Turon@2024");

        mockMvc.perform(get("/api/dashboard/enrollment")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));

        mockMvc.perform(get("/api/dashboard/recent-students")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void recentInstitutionsEndpointReturnsLatestInstitutions() throws Exception {
        String token = loginAs("super_admin", "Super@2024");

        mockMvc.perform(get("/api/super-admin/recent-institutions")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").exists())
                .andExpect(jsonPath("$.data[0].modulesCount").isNumber())
                .andExpect(jsonPath("$.data[0].status").isNotEmpty());
    }

    private String loginAs(String username, String password) throws Exception {
        String body = "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";

        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return response.split("\"token\":\"")[1].split("\"")[0];
    }
}
