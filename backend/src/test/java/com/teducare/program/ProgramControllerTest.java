package com.teducare.program;

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
class ProgramControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullProgramLifecycleIncludingIndependentFksAndProgramTypeValidation() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionAId = createInstitution(superToken, "Program Test University " + suffix);
        String institutionBId = createInstitution(superToken, "Program Test University B " + suffix);
        String usernameA = "prog_admin_" + suffix;
        String usernameB = "prog_admin_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "prog_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "prog_b_" + suffix);
            String tokenA = loginAs(usernameA, "ProgTest@2026");
            String tokenB = loginAs(usernameB, "ProgTest@2026");

            String schoolAId = createSchool(tokenA, "School of Prog Test A");
            String facultyAId = createFaculty(tokenA, "Faculty of Prog Test A", schoolAId);
            String otherFacultyAId = createFaculty(tokenA, "Other Faculty A", schoolAId);
            String departmentAId = createDepartment(tokenA, "Dept of Prog Test A", facultyAId, schoolAId);
            String schoolBId = createSchool(tokenB, "School of Prog Test B");
            String facultyBId = createFaculty(tokenB, "Faculty of Prog Test B", schoolBId);
            String departmentBId = createDepartment(tokenB, "Dept of Prog Test B", facultyBId, schoolBId);

            // departmentId from a different institution is rejected.
            mockMvc.perform(post("/api/programs")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Hijack Program\",\"departmentId\":\"" + departmentBId
                            + "\",\"facultyId\":\"" + facultyAId + "\",\"programType\":\"Undergraduate\"}"))
                    .andExpect(status().isNotFound());

            // facultyId from a different institution is rejected (departmentId valid).
            mockMvc.perform(post("/api/programs")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Hijack Program 2\",\"departmentId\":\"" + departmentAId
                            + "\",\"facultyId\":\"" + facultyBId + "\",\"programType\":\"Undergraduate\"}"))
                    .andExpect(status().isNotFound());

            // Invalid programType rejected.
            mockMvc.perform(post("/api/programs")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Bad Type Program\",\"departmentId\":\"" + departmentAId
                            + "\",\"facultyId\":\"" + facultyAId + "\",\"programType\":\"Diploma\"}"))
                    .andExpect(status().isBadRequest());

            // Create with facultyId independent of (different dean's own faculty than) departmentId's own faculty.
            String createResponse = mockMvc.perform(post("/api/programs")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Program of Testing\",\"departmentId\":\"" + departmentAId
                            + "\",\"facultyId\":\"" + otherFacultyAId + "\",\"programType\":\"Undergraduate\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.departmentId").value(departmentAId))
                    .andExpect(jsonPath("$.facultyId").value(otherFacultyAId))
                    .andExpect(jsonPath("$.programType").value("Undergraduate"))
                    .andReturn().getResponse().getContentAsString();
            String programId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // Duplicate name (case-insensitive) rejected.
            mockMvc.perform(post("/api/programs")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"program of testing\",\"departmentId\":\"" + departmentAId
                            + "\",\"facultyId\":\"" + facultyAId + "\",\"programType\":\"Postgraduate\"}"))
                    .andExpect(status().isConflict());

            // Filter by departmentId (include) and facultyId=facultyAId (exclude, since program's own faculty is otherFacultyAId).
            String filteredByDept = mockMvc.perform(get("/api/programs?departmentId=" + departmentAId)
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(filteredByDept.contains(programId));
            String filteredByOtherFaculty = mockMvc.perform(get("/api/programs?facultyId=" + facultyAId)
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(filteredByOtherFaculty.contains(programId));

            // Patch programType.
            mockMvc.perform(patch("/api/programs/" + programId)
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"programType\":\"Postgraduate\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.programType").value("Postgraduate"));

            // Reassigning facultyId to institution B's faculty is rejected.
            mockMvc.perform(patch("/api/programs/" + programId)
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"facultyId\":\"" + facultyBId + "\"}"))
                    .andExpect(status().isNotFound());

            // Institution B must not see institution A's program.
            String listForB = mockMvc.perform(get("/api/programs")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listForB.contains(programId));

            // Archive + restore round trip.
            mockMvc.perform(post("/api/programs/" + programId + "/archive")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            String listWithoutArchived = mockMvc.perform(get("/api/programs")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listWithoutArchived.contains(programId));
            mockMvc.perform(post("/api/programs/" + programId + "/restore")
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

    private String createFaculty(String token, String name, String schoolId) throws Exception {
        String response = mockMvc.perform(post("/api/faculties")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"deanName\":\"Someone\",\"schoolId\":\"" + schoolId + "\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createDepartment(String token, String name, String facultyId, String schoolId) throws Exception {
        String response = mockMvc.perform(post("/api/departments")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"hodName\":\"Someone\",\"facultyId\":\"" + facultyId
                        + "\",\"schoolId\":\"" + schoolId + "\"}"))
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
                         "adminUser":"Test Admin","adminEmail":"admin@programtestuniversity.edu.ng"}
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
                        {"firstName":"Program","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"ProgTest@2026",
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
