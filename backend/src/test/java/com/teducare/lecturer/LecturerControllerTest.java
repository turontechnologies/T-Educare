package com.teducare.lecturer;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
class LecturerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullLifecycleWithValidationAndCrossInstitutionIsolation() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionAId = createInstitution(superToken, "Lecturer Test University " + suffix);
        String institutionBId = createInstitution(superToken, "Lecturer Test University B " + suffix);
        String usernameA = "lecturer_admin_" + suffix;
        String usernameB = "lecturer_admin_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "lecturer_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "lecturer_b_" + suffix);
            String tokenA = loginAs(usernameA, "LecturerTest@2026");
            String tokenB = loginAs(usernameB, "LecturerTest@2026");

            String schoolAId = createSchool(tokenA, "School of Lecturer Test A");
            String schoolBId = createSchool(tokenB, "School of Lecturer Test B");

            // Invalid position rejected.
            mockMvc.perform(post("/api/lecturers")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"username":"UL-%s","position":"Bogus Rank","assignmentType":"school",
                             "assignmentId":"%s","gender":"Male","firstName":"Ada","lastName":"Okoye",
                             "email":"ada.okoye@lecturertest.edu","phone":"08011112222"}
                            """.formatted(suffix, schoolAId)))
                    .andExpect(status().isBadRequest());

            // A school from a different institution is rejected.
            mockMvc.perform(post("/api/lecturers")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"username":"UL-%s","position":"Senior Lecturer","assignmentType":"school",
                             "assignmentId":"%s","gender":"Male","firstName":"Ada","lastName":"Okoye",
                             "email":"ada.okoye@lecturertest.edu","phone":"08011112222"}
                            """.formatted(suffix, schoolBId)))
                    .andExpect(status().isNotFound());

            // Create.
            String createResponse = mockMvc.perform(post("/api/lecturers")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"username":"UL-%s","position":"Senior Lecturer","assignmentType":"school",
                             "assignmentId":"%s","gender":"Male","firstName":"Ada","lastName":"Okoye",
                             "email":"ada.okoye@lecturertest.edu","phone":"08011112222"}
                            """.formatted(suffix, schoolAId)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.position").value("Senior Lecturer"))
                    .andExpect(jsonPath("$.assignmentId").value(schoolAId))
                    .andReturn().getResponse().getContentAsString();
            String lecturerId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // Duplicate username (case-insensitive) rejected.
            mockMvc.perform(post("/api/lecturers")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"username":"ul-%s","position":"Lecturer I","assignmentType":"school",
                             "assignmentId":"%s","gender":"Female","firstName":"Chika","lastName":"Nwosu",
                             "email":"chika.nwosu@lecturertest.edu","phone":"08022223333"}
                            """.formatted(suffix, schoolAId)))
                    .andExpect(status().isConflict());

            // Edit.
            mockMvc.perform(patch("/api/lecturers/" + lecturerId)
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"position\":\"Professor\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.position").value("Professor"))
                    .andExpect(jsonPath("$.username").value("UL-" + suffix));

            // Institution B must not see institution A's lecturer.
            String listForB = mockMvc.perform(get("/api/lecturers")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listForB.contains(lecturerId));

            // Archive + restore round trip.
            mockMvc.perform(post("/api/lecturers/" + lecturerId + "/archive")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            String listWithoutArchived = mockMvc.perform(get("/api/lecturers")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listWithoutArchived.contains(lecturerId));
            mockMvc.perform(post("/api/lecturers/" + lecturerId + "/restore")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").doesNotExist());
            String listAfterRestore = mockMvc.perform(get("/api/lecturers")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(listAfterRestore.contains(lecturerId));
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

    private String createSchool(String token, String name) throws Exception {
        String response = mockMvc.perform(post("/api/schools")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"headName\":\"Someone\",\"designation\":\"HOD\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createInstitution(String superToken, String name) throws Exception {
        String response = mockMvc.perform(post("/api/institutions")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"%s","institutionType":"University",
                         "adminUser":"Test Admin","adminEmail":"admin@lecturertestuniversity.edu.ng"}
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
                        {"firstName":"Lecturer","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"LecturerTest@2026",
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
