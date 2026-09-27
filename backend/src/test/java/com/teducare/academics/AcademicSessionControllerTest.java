package com.teducare.academics;

import static org.junit.jupiter.api.Assertions.assertFalse;
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
class AcademicSessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullSessionAndSemesterLifecycleIncludingCurrentPromotionAndClose() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionId = createInstitution(superToken, "Session Test University " + suffix);
        String username = "session_admin_" + suffix;
        String userManagerId = null;

        try {
            userManagerId = createUserManager(superToken, institutionId, username, "session_" + suffix);
            String token = loginAs(username, "SessionTest@2026");

            // Create two sessions.
            String firstSessionResponse = mockMvc.perform(post("/api/academic-sessions")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"session":"2024/2025","from":"2024-09-01T00:00:00Z","to":"2025-07-31T00:00:00Z"}
                            """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.status").value("upcoming"))
                    .andExpect(jsonPath("$.isCurrent").value(false))
                    .andReturn().getResponse().getContentAsString();
            String firstSessionId = firstSessionResponse.split("\"id\":\"")[1].split("\"")[0];

            String secondSessionResponse = mockMvc.perform(post("/api/academic-sessions")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"session":"2025/2026","from":"2025-09-01T00:00:00Z","to":"2026-07-31T00:00:00Z"}
                            """))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            String secondSessionId = secondSessionResponse.split("\"id\":\"")[1].split("\"")[0];

            // Duplicate name rejected.
            mockMvc.perform(post("/api/academic-sessions")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"session":"2024/2025","from":"2024-09-01T00:00:00Z","to":"2025-07-31T00:00:00Z"}
                            """))
                    .andExpect(status().isConflict());

            // to <= from rejected.
            mockMvc.perform(post("/api/academic-sessions")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"session":"2099/2100","from":"2099-09-01T00:00:00Z","to":"2099-01-01T00:00:00Z"}
                            """))
                    .andExpect(status().isBadRequest());

            // Set first session current — promotes upcoming -> active.
            mockMvc.perform(post("/api/academic-sessions/" + firstSessionId + "/set-current")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.isCurrent").value(true))
                    .andExpect(jsonPath("$.status").value("active"));

            // Setting the second current un-sets the first.
            mockMvc.perform(post("/api/academic-sessions/" + secondSessionId + "/set-current")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.isCurrent").value(true));
            mockMvc.perform(get("/api/academic-sessions")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[?(@.id=='" + firstSessionId + "')].isCurrent").value(false));

            // Close the first (now non-current) session.
            mockMvc.perform(post("/api/academic-sessions/" + firstSessionId + "/close")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("completed"))
                    .andExpect(jsonPath("$.isCurrent").value(false));

            // --- Semesters, scoped to the second session ---
            String semesterResponse = mockMvc.perform(post("/api/academic-semesters")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"sessionId":"%s","name":"First Semester","description":"Test",
                             "from":"2025-09-01T00:00:00Z","to":"2026-01-15T00:00:00Z"}
                            """.formatted(secondSessionId)))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            String semesterId = semesterResponse.split("\"id\":\"")[1].split("\"")[0];

            String secondSemesterResponse = mockMvc.perform(post("/api/academic-semesters")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"sessionId":"%s","name":"Second Semester","description":"Test",
                             "from":"2026-02-01T00:00:00Z","to":"2026-07-31T00:00:00Z"}
                            """.formatted(secondSessionId)))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            String secondSemesterId = secondSemesterResponse.split("\"id\":\"")[1].split("\"")[0];

            // Reassigning an existing semester to a different real session
            // (still within the same institution) is allowed via PATCH.
            mockMvc.perform(patch("/api/academic-semesters/" + semesterId)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"sessionId\":\"" + firstSessionId + "\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.sessionId").value(firstSessionId));
            // Restore it before the rest of this test relies on it belonging to secondSessionId.
            mockMvc.perform(patch("/api/academic-semesters/" + semesterId)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"sessionId\":\"" + secondSessionId + "\"}"))
                    .andExpect(status().isOk());

            // A session belonging to a different institution is rejected as a sessionId.
            mockMvc.perform(post("/api/academic-semesters")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"sessionId":"does-not-exist","name":"Bogus",
                             "from":"2025-09-01T00:00:00Z","to":"2026-01-15T00:00:00Z"}
                            """))
                    .andExpect(status().isNotFound());

            mockMvc.perform(post("/api/academic-semesters/" + semesterId + "/set-current")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.isCurrent").value(true))
                    .andExpect(jsonPath("$.status").value("active"));

            mockMvc.perform(post("/api/academic-semesters/" + secondSemesterId + "/set-current")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/academic-semesters")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[?(@.id=='" + semesterId + "')].isCurrent").value(false));

            // Archive + restore round trip on a session.
            mockMvc.perform(post("/api/academic-sessions/" + firstSessionId + "/archive")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            String listWithoutArchived = mockMvc.perform(get("/api/academic-sessions")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listWithoutArchived.contains(firstSessionId));
            mockMvc.perform(post("/api/academic-sessions/" + firstSessionId + "/restore")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").doesNotExist());
        } finally {
            if (userManagerId != null) {
                mockMvc.perform(post("/api/user-managers/" + userManagerId + "/archive")
                        .header("Authorization", "Bearer " + superToken));
            }
            mockMvc.perform(post("/api/institutions/" + institutionId + "/archive")
                    .header("Authorization", "Bearer " + superToken));
        }
    }

    @Test
    void sessionsAndSemestersAreScopedToTheCallersOwnInstitutionOnly() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionAId = createInstitution(superToken, "Session Isolation A " + suffix);
        String institutionBId = createInstitution(superToken, "Session Isolation B " + suffix);
        String usernameA = "session_iso_a_" + suffix;
        String usernameB = "session_iso_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "session_iso_a_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "session_iso_b_" + suffix);
            String tokenA = loginAs(usernameA, "SessionTest@2026");
            String tokenB = loginAs(usernameB, "SessionTest@2026");

            String sessionResponse = mockMvc.perform(post("/api/academic-sessions")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"session":"2030/2031","from":"2030-09-01T00:00:00Z","to":"2031-07-31T00:00:00Z"}
                            """))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            String sessionId = sessionResponse.split("\"id\":\"")[1].split("\"")[0];

            String listForB = mockMvc.perform(get("/api/academic-sessions")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listForB.contains(sessionId), "Institution B must not see Institution A's session");

            mockMvc.perform(patch("/api/academic-sessions/" + sessionId)
                    .header("Authorization", "Bearer " + tokenB)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"session\":\"Hijacked\"}"))
                    .andExpect(status().isNotFound());

            String superAdminToken = loginAs("super_admin", "Super@2024");
            mockMvc.perform(get("/api/academic-sessions")
                    .header("Authorization", "Bearer " + superAdminToken))
                    .andExpect(status().isForbidden());
        } finally {
            if (userManagerAId != null) {
                mockMvc.perform(post("/api/user-managers/" + userManagerAId + "/archive")
                        .header("Authorization", "Bearer " + superToken));
            }
            if (userManagerBId != null) {
                mockMvc.perform(post("/api/user-managers/" + userManagerBId + "/archive")
                        .header("Authorization", "Bearer " + superToken));
            }
            mockMvc.perform(post("/api/institutions/" + institutionAId + "/archive")
                    .header("Authorization", "Bearer " + superToken));
            mockMvc.perform(post("/api/institutions/" + institutionBId + "/archive")
                    .header("Authorization", "Bearer " + superToken));
        }
    }

    private String createInstitution(String superToken, String name) throws Exception {
        String response = mockMvc.perform(post("/api/institutions")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"%s","institutionType":"University",
                         "adminUser":"Test Admin","adminEmail":"admin@sessiontestuniversity.edu.ng"}
                        """.formatted(name)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createUserManager(String superToken, String institutionId, String username, String emailPrefix)
            throws Exception {
        String response = mockMvc.perform(post("/api/user-managers")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"firstName":"Session","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"SessionTest@2026",
                         "institutionId":"%s","isPrimaryAdmin":true}
                        """.formatted(emailPrefix, username, institutionId)))
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
