package com.teducare.faculty;

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
class FacultyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullFacultyLifecycleIncludingSchoolFkAndCrossInstitutionRejection() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionAId = createInstitution(superToken, "Faculty Test University " + suffix);
        String institutionBId = createInstitution(superToken, "Faculty Test University B " + suffix);
        String usernameA = "faculty_admin_" + suffix;
        String usernameB = "faculty_admin_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "faculty_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "faculty_b_" + suffix);
            String tokenA = loginAs(usernameA, "FacultyTest@2026");
            String tokenB = loginAs(usernameB, "FacultyTest@2026");

            String schoolAId = createSchool(tokenA, "School of Faculty Test A");
            String otherSchoolAId = createSchool(tokenA, "Other School A");
            String schoolBId = createSchool(tokenB, "School of Faculty Test B");

            // A schoolId belonging to a different institution is rejected outright.
            mockMvc.perform(post("/api/faculties")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Hijack Faculty\",\"deanName\":\"Someone\",\"schoolId\":\"" + schoolBId + "\"}"))
                    .andExpect(status().isNotFound());

            // A schoolId that just doesn't exist is rejected the same way.
            mockMvc.perform(post("/api/faculties")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Bogus Faculty\",\"deanName\":\"Someone\",\"schoolId\":\"does-not-exist\"}"))
                    .andExpect(status().isNotFound());

            String createResponse = mockMvc.perform(post("/api/faculties")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Faculty of Testing\",\"deanName\":\"Dr. Test\",\"schoolId\":\"" + schoolAId + "\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.schoolId").value(schoolAId))
                    .andReturn().getResponse().getContentAsString();
            String facultyId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // Duplicate name (case-insensitive) rejected.
            mockMvc.perform(post("/api/faculties")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"faculty of testing\",\"deanName\":\"Someone Else\",\"schoolId\":\"" + schoolAId + "\"}"))
                    .andExpect(status().isConflict());

            // Filter by schoolId.
            String filtered = mockMvc.perform(get("/api/faculties?schoolId=" + otherSchoolAId)
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(filtered.contains(facultyId), "Filtering by a different schoolId must exclude this faculty");

            // Reassign to a different real school within the same institution.
            mockMvc.perform(patch("/api/faculties/" + facultyId)
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"schoolId\":\"" + otherSchoolAId + "\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.schoolId").value(otherSchoolAId));

            // Reassigning to institution B's school is rejected.
            mockMvc.perform(patch("/api/faculties/" + facultyId)
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"schoolId\":\"" + schoolBId + "\"}"))
                    .andExpect(status().isNotFound());

            // Institution B must not see institution A's faculty at all.
            String listForB = mockMvc.perform(get("/api/faculties")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listForB.contains(facultyId));

            // Archive + restore round trip.
            mockMvc.perform(post("/api/faculties/" + facultyId + "/archive")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            String listWithoutArchived = mockMvc.perform(get("/api/faculties")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listWithoutArchived.contains(facultyId));
            String listWithArchived = mockMvc.perform(get("/api/faculties?includeArchived=true")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(listWithArchived.contains(facultyId));
            mockMvc.perform(post("/api/faculties/" + facultyId + "/restore")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").doesNotExist());
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
                         "adminUser":"Test Admin","adminEmail":"admin@facultytestuniversity.edu.ng"}
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
                        {"firstName":"Faculty","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"FacultyTest@2026",
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
