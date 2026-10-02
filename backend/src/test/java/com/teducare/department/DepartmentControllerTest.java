package com.teducare.department;

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
class DepartmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullDepartmentLifecycleIncludingIndependentFksAndCrossInstitutionRejection() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionAId = createInstitution(superToken, "Department Test University " + suffix);
        String institutionBId = createInstitution(superToken, "Department Test University B " + suffix);
        String usernameA = "dept_admin_" + suffix;
        String usernameB = "dept_admin_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "dept_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "dept_b_" + suffix);
            String tokenA = loginAs(usernameA, "DeptTest@2026");
            String tokenB = loginAs(usernameB, "DeptTest@2026");

            String schoolAId = createSchool(tokenA, "School of Dept Test A");
            // A deliberately *different* school than the faculty's own, to
            // prove facultyId/schoolId are independent FKs, not derived.
            String otherSchoolAId = createSchool(tokenA, "Other School A");
            String facultyAId = createFaculty(tokenA, "Faculty of Dept Test A", schoolAId);
            String schoolBId = createSchool(tokenB, "School of Dept Test B");
            String facultyBId = createFaculty(tokenB, "Faculty of Dept Test B", schoolBId);

            // facultyId from a different institution is rejected.
            mockMvc.perform(post("/api/departments")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Hijack Dept\",\"hodName\":\"Someone\",\"facultyId\":\"" + facultyBId
                            + "\",\"schoolId\":\"" + schoolAId + "\"}"))
                    .andExpect(status().isNotFound());

            // schoolId from a different institution is rejected (facultyId valid).
            mockMvc.perform(post("/api/departments")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Hijack Dept 2\",\"hodName\":\"Someone\",\"facultyId\":\"" + facultyAId
                            + "\",\"schoolId\":\"" + schoolBId + "\"}"))
                    .andExpect(status().isNotFound());

            // Create with facultyId's own school != department's own schoolId —
            // must be accepted, proving these are independent FKs (§7.6).
            String createResponse = mockMvc.perform(post("/api/departments")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Department of Testing\",\"hodName\":\"Dr. Test\",\"facultyId\":\""
                            + facultyAId + "\",\"schoolId\":\"" + otherSchoolAId + "\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.facultyId").value(facultyAId))
                    .andExpect(jsonPath("$.schoolId").value(otherSchoolAId))
                    .andReturn().getResponse().getContentAsString();
            String departmentId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // Duplicate name (case-insensitive) rejected.
            mockMvc.perform(post("/api/departments")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"department of testing\",\"hodName\":\"Someone Else\",\"facultyId\":\""
                            + facultyAId + "\",\"schoolId\":\"" + schoolAId + "\"}"))
                    .andExpect(status().isConflict());

            // Filter by facultyId and by schoolId.
            String filteredByFaculty = mockMvc.perform(get("/api/departments?facultyId=" + facultyAId)
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(filteredByFaculty.contains(departmentId));
            String filteredBySchool = mockMvc.perform(get("/api/departments?schoolId=" + schoolAId)
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(filteredBySchool.contains(departmentId), "Filtering by the OTHER school must exclude this department");

            // Reassign schoolId to a different real school within the institution.
            mockMvc.perform(patch("/api/departments/" + departmentId)
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"schoolId\":\"" + schoolAId + "\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.schoolId").value(schoolAId));

            // Reassigning facultyId to institution B's faculty is rejected.
            mockMvc.perform(patch("/api/departments/" + departmentId)
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"facultyId\":\"" + facultyBId + "\"}"))
                    .andExpect(status().isNotFound());

            // Institution B must not see institution A's department.
            String listForB = mockMvc.perform(get("/api/departments")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listForB.contains(departmentId));

            // Archive + restore round trip.
            mockMvc.perform(post("/api/departments/" + departmentId + "/archive")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            String listWithoutArchived = mockMvc.perform(get("/api/departments")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listWithoutArchived.contains(departmentId));
            mockMvc.perform(post("/api/departments/" + departmentId + "/restore")
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

    private String createInstitution(String superToken, String name) throws Exception {
        String response = mockMvc.perform(post("/api/institutions")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"%s","institutionType":"University",
                         "adminUser":"Test Admin","adminEmail":"admin@depttestuniversity.edu.ng"}
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
                        {"firstName":"Department","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"DeptTest@2026",
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
