package com.teducare.elective;

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
class ElectiveGroupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullLifecycleWithValidationAndCrossInstitutionIsolation() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionAId = createInstitution(superToken, "Elective Test University " + suffix);
        String institutionBId = createInstitution(superToken, "Elective Test University B " + suffix);
        String usernameA = "elective_admin_" + suffix;
        String usernameB = "elective_admin_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "elective_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "elective_b_" + suffix);
            String tokenA = loginAs(usernameA, "ElectiveTest@2026");
            String tokenB = loginAs(usernameB, "ElectiveTest@2026");

            String schoolAId = createSchool(tokenA, "School of Elective Test A");
            String facultyAId = createFaculty(tokenA, "Faculty of Elective Test A", schoolAId);
            String departmentAId = createDepartment(tokenA, "Dept of Elective Test A", facultyAId, schoolAId);
            String otherDepartmentAId =
                    createDepartment(tokenA, "Other Dept of Elective Test A", facultyAId, schoolAId);
            String levelAId = createProgramLevel(tokenA, "L-" + suffix);
            String courseA1Id = createCourse(tokenA, "Elective X", "ELX101-" + suffix, departmentAId, levelAId);
            String courseA2Id = createCourse(tokenA, "Elective Y", "ELY101-" + suffix, departmentAId, levelAId);
            String courseOtherDeptId =
                    createCourse(tokenA, "Other Dept Course", "ODC101-" + suffix, otherDepartmentAId, levelAId);

            // Fewer than 2 courses rejected.
            mockMvc.perform(post("/api/elective-groups")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"departmentId\":\"" + departmentAId + "\",\"programLevelId\":\"" + levelAId
                            + "\",\"name\":\"Too Small\",\"minSelect\":1,\"maxSelect\":1,\"courseIds\":[\""
                            + courseA1Id + "\"]}"))
                    .andExpect(status().isBadRequest());

            // minSelect > maxSelect rejected.
            mockMvc.perform(post("/api/elective-groups")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"departmentId\":\"" + departmentAId + "\",\"programLevelId\":\"" + levelAId
                            + "\",\"name\":\"Bad Bounds\",\"minSelect\":2,\"maxSelect\":1,\"courseIds\":[\""
                            + courseA1Id + "\",\"" + courseA2Id + "\"]}"))
                    .andExpect(status().isBadRequest());

            // A course not eligible for this department (no offering, different owner) rejected.
            mockMvc.perform(post("/api/elective-groups")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"departmentId\":\"" + departmentAId + "\",\"programLevelId\":\"" + levelAId
                            + "\",\"name\":\"Bad Course\",\"minSelect\":1,\"maxSelect\":1,\"courseIds\":[\""
                            + courseA1Id + "\",\"" + courseOtherDeptId + "\"]}"))
                    .andExpect(status().isBadRequest());

            // Valid create.
            String createResponse = mockMvc.perform(post("/api/elective-groups")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"departmentId\":\"" + departmentAId + "\",\"programLevelId\":\"" + levelAId
                            + "\",\"name\":\"Elective Group 1\",\"minSelect\":1,\"maxSelect\":1,\"courseIds\":[\""
                            + courseA1Id + "\",\"" + courseA2Id + "\"]}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.name").value("Elective Group 1"))
                    .andExpect(jsonPath("$.courseIds.length()").value(2))
                    .andReturn().getResponse().getContentAsString();
            String groupId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // Edit.
            mockMvc.perform(patch("/api/elective-groups/" + groupId)
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Elective Group 1 Renamed\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Elective Group 1 Renamed"));

            // Institution B must not see institution A's group.
            String listForB = mockMvc.perform(get("/api/elective-groups")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listForB.contains(groupId));

            // Archive + restore round trip.
            mockMvc.perform(post("/api/elective-groups/" + groupId + "/archive")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            String listWithoutArchived = mockMvc.perform(get("/api/elective-groups")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listWithoutArchived.contains(groupId));
            mockMvc.perform(post("/api/elective-groups/" + groupId + "/restore")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").doesNotExist());
            String listAfterRestore = mockMvc.perform(get("/api/elective-groups")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(listAfterRestore.contains(groupId));
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
                .andReturn().getResponse().getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createFaculty(String token, String name, String schoolId) throws Exception {
        String response = mockMvc.perform(post("/api/faculties")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"deanName\":\"Someone\",\"schoolId\":\"" + schoolId + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createDepartment(String token, String name, String facultyId, String schoolId) throws Exception {
        String response = mockMvc.perform(post("/api/departments")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"hodName\":\"Someone\",\"facultyId\":\"" + facultyId
                        + "\",\"schoolId\":\"" + schoolId + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createProgramLevel(String token, String levelCode) throws Exception {
        String response = mockMvc.perform(post("/api/program-levels")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"levelCode\":\"" + levelCode + "\",\"description\":\"" + levelCode + " description\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createCourse(String token, String name, String code, String departmentId, String programLevelId)
            throws Exception {
        String schoolIdForCourse = createSchool(token, "School for " + code);
        String response = mockMvc.perform(post("/api/courses")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"code\":\"" + code + "\",\"departmentId\":\"" + departmentId
                        + "\",\"schoolId\":\"" + schoolIdForCourse + "\",\"programLevelId\":\"" + programLevelId
                        + "\",\"unit\":3,\"semesterNumber\":1}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createInstitution(String superToken, String name) throws Exception {
        String response = mockMvc.perform(post("/api/institutions")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"%s","institutionType":"University",
                         "adminUser":"Test Admin","adminEmail":"admin@electivetestuniversity.edu.ng"}
                        """.formatted(name)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createUserManager(String superToken, String institutionId, String username, String emailPrefix)
            throws Exception {
        String response = mockMvc.perform(post("/api/user-managers")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"firstName":"Elective","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"ElectiveTest@2026",
                         "institutionId":"%s","isPrimaryAdmin":true}
                        """.formatted(emailPrefix, username, institutionId)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
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
