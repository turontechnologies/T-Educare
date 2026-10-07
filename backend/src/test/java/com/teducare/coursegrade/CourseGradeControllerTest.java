package com.teducare.coursegrade;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class CourseGradeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullCourseGradeLifecycleIncludingScoreRangeAndDuplicateRejection() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionId = createInstitution(superToken, "Course Grade Test University " + suffix);
        String username = "grade_admin_" + suffix;
        String userManagerId = null;

        try {
            userManagerId = createUserManager(superToken, institutionId, username, "grade_" + suffix);
            String token = loginAs(username, "GradeTest@2026");

            String createResponse = mockMvc.perform(post("/api/course-grades")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"code":"A","remark":"Distinction","gradeScore":5,"minimumScore":70,"maximumScore":100}
                            """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.code").value("A"))
                    .andExpect(jsonPath("$.archivedAt").doesNotExist())
                    .andReturn().getResponse().getContentAsString();
            String gradeId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // maximumScore <= minimumScore rejected.
            mockMvc.perform(post("/api/course-grades")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"code":"B","remark":"Good","gradeScore":4,"minimumScore":60,"maximumScore":60}
                            """))
                    .andExpect(status().isBadRequest());

            // Duplicate code (case-insensitive) rejected.
            mockMvc.perform(post("/api/course-grades")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"code":"a","remark":"Different","gradeScore":5,"minimumScore":70,"maximumScore":100}
                            """))
                    .andExpect(status().isConflict());

            // Edit — reject shrinking the range into an invalid one.
            mockMvc.perform(patch("/api/course-grades/" + gradeId)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"minimumScore\":101}"))
                    .andExpect(status().isBadRequest());

            // Valid edit.
            mockMvc.perform(patch("/api/course-grades/" + gradeId)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"remark\":\"Excellent\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.remark").value("Excellent"))
                    .andExpect(jsonPath("$.code").value("A"));

            // Archive + restore round trip.
            mockMvc.perform(post("/api/course-grades/" + gradeId + "/archive")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            String listWithoutArchived = mockMvc.perform(get("/api/course-grades")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listWithoutArchived.contains(gradeId));
            String listWithArchived = mockMvc.perform(get("/api/course-grades?includeArchived=true")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(listWithArchived.contains(gradeId));
            mockMvc.perform(post("/api/course-grades/" + gradeId + "/restore")
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
    void courseGradesAreScopedToTheCallersOwnInstitutionOnly() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionAId = createInstitution(superToken, "Course Grade Isolation A " + suffix);
        String institutionBId = createInstitution(superToken, "Course Grade Isolation B " + suffix);
        String usernameA = "grade_iso_a_" + suffix;
        String usernameB = "grade_iso_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "grade_iso_a_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "grade_iso_b_" + suffix);
            String tokenA = loginAs(usernameA, "GradeTest@2026");
            String tokenB = loginAs(usernameB, "GradeTest@2026");

            String gradeResponse = mockMvc.perform(post("/api/course-grades")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"code":"C","remark":"Credit","gradeScore":3,"minimumScore":50,"maximumScore":59}
                            """))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            String gradeId = gradeResponse.split("\"id\":\"")[1].split("\"")[0];

            String listForB = mockMvc.perform(get("/api/course-grades")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listForB.contains(gradeId), "Institution B must not see Institution A's course grade");

            mockMvc.perform(patch("/api/course-grades/" + gradeId)
                    .header("Authorization", "Bearer " + tokenB)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"code\":\"Hijacked\"}"))
                    .andExpect(status().isNotFound());

            String superAdminToken = loginAs("super_admin", "Super@2024");
            mockMvc.perform(get("/api/course-grades")
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

    @Test
    void gradingScaleDefaultsThenPersistsWholesaleUpdateScopedToOwnInstitution() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionAId = createInstitution(superToken, "Grading Scale Test A " + suffix);
        String institutionBId = createInstitution(superToken, "Grading Scale Test B " + suffix);
        String usernameA = "scale_a_" + suffix;
        String usernameB = "scale_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "scale_a_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "scale_b_" + suffix);
            String tokenA = loginAs(usernameA, "GradeTest@2026");
            String tokenB = loginAs(usernameB, "GradeTest@2026");

            // No row yet — defaults to 5, matching the pre-backend mock's own default.
            mockMvc.perform(get("/api/grading-scale")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.maxGradePoint").value(5));

            // Set a real value for A.
            mockMvc.perform(put("/api/grading-scale")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"maxGradePoint\":4}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.maxGradePoint").value(4));

            // Persists on a fresh GET.
            mockMvc.perform(get("/api/grading-scale")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.maxGradePoint").value(4));

            // Institution B's own scale is untouched — still the default, proving this is scoped per-institution, not global.
            mockMvc.perform(get("/api/grading-scale")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.maxGradePoint").value(5));
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
                         "adminUser":"Test Admin","adminEmail":"admin@coursegradetestuniversity.edu.ng"}
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
                        {"firstName":"Grade","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"GradeTest@2026",
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
