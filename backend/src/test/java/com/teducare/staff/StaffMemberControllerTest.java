package com.teducare.staff;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class StaffMemberControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullStaffLifecycleIncludingQualificationsCsvAndCrossInstitutionIsolation() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String shortSuffix = suffix.substring(suffix.length() - 6);
        String institutionAId = createInstitution(superToken, "Staff Test University " + suffix);
        String institutionBId = createInstitution(superToken, "Staff Test University B " + suffix);
        String usernameA = "staff_admin_" + suffix;
        String usernameB = "staff_admin_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "staff_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "staff_b_" + suffix);
            String tokenA = loginAs(usernameA, "StaffTest@2026");
            String tokenB = loginAs(usernameB, "StaffTest@2026");

            String schoolAId = createSchool(tokenA, "School of Staff Test A");
            String facultyAId = createFaculty(tokenA, "Faculty of Staff Test A", schoolAId);
            String departmentAId = createDepartment(tokenA, "Dept of Staff Test A", facultyAId, schoolAId);
            String schoolBId = createSchool(tokenB, "School of Staff Test B");
            String facultyBId = createFaculty(tokenB, "Faculty of Staff Test B", schoolBId);
            String departmentBId = createDepartment(tokenB, "Dept of Staff Test B", facultyBId, schoolBId);

            String lecturerDesigAId = createDesignation(tokenA, "Lecturer-" + shortSuffix, "Academic Staff");
            String hodDesigAId = createDesignation(tokenA, "HOD-" + shortSuffix, "Academic Staff");
            String desigBId = createDesignation(tokenB, "Bursar-" + shortSuffix, "Non-Academic Staff");

            // departmentId from a different institution is rejected.
            mockMvc.perform(post("/api/staff-members")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(staffBody("SU-STAFF-" + shortSuffix, lecturerDesigAId, hodDesigAId, departmentBId))
                    )
                    .andExpect(status().isNotFound());

            // roleId from a different institution is rejected (department valid).
            mockMvc.perform(post("/api/staff-members")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(staffBody("SU-STAFF2-" + shortSuffix, desigBId, hodDesigAId, departmentAId))
                    )
                    .andExpect(status().isNotFound());

            // Invalid gender rejected.
            mockMvc.perform(post("/api/staff-members")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"staffId":"SU-STAFF3-%s","roleId":"%s","designationId":"%s","departmentId":"%s",
                             "gender":"Alien","firstName":"Bad","lastName":"Gender","maritalStatus":"Single",
                             "email":"bad.gender@staff.test","phone":"08000000000",
                             "emergencyContact":"08000000001","dateOfBirth":"1985-01-01T00:00:00Z",
                             "employmentStartDate":"2020-01-01T00:00:00Z","contactAddress":"1 Test Street"}
                            """.formatted(shortSuffix, lecturerDesigAId, hodDesigAId, departmentAId))
                    )
                    .andExpect(status().isBadRequest());

            // Create a real staff member.
            String createResponse = mockMvc.perform(post("/api/staff-members")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(staffBody("SU-STAFF-" + shortSuffix, lecturerDesigAId, hodDesigAId, departmentAId))
                    )
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.staffId").value("SU-STAFF-" + shortSuffix))
                    .andExpect(jsonPath("$.roleId").value(lecturerDesigAId))
                    .andExpect(jsonPath("$.designationId").value(hodDesigAId))
                    .andReturn().getResponse().getContentAsString();
            String staffId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // Duplicate staffId (case-insensitive) rejected.
            mockMvc.perform(post("/api/staff-members")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(staffBody("su-staff-" + shortSuffix, lecturerDesigAId, hodDesigAId, departmentAId))
                    )
                    .andExpect(status().isConflict());

            // Edit.
            mockMvc.perform(patch("/api/staff-members/" + staffId)
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"salaryAmount\":450000.00,\"salaryCurrency\":\"NGN\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.salaryAmount").value(450000.00))
                    .andExpect(jsonPath("$.salaryCurrency").value("NGN"));

            // Qualifications: add two, list, delete one.
            String qual1Response = mockMvc.perform(post("/api/staff-members/" + staffId + "/qualifications")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"degree\":\"B.Sc.\",\"fieldOfStudy\":\"Computer Science\","
                            + "\"institutionAttended\":\"University of Lagos\",\"yearObtained\":2010}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.degree").value("B.Sc."))
                    .andReturn().getResponse().getContentAsString();
            String qual1Id = qual1Response.split("\"id\":\"")[1].split("\"")[0];

            mockMvc.perform(post("/api/staff-members/" + staffId + "/qualifications")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"degree\":\"M.Sc.\",\"fieldOfStudy\":\"Computer Science\","
                            + "\"institutionAttended\":\"University of Ibadan\",\"yearObtained\":2014}"))
                    .andExpect(status().isCreated());

            String qualList = mockMvc.perform(get("/api/staff-members/" + staffId + "/qualifications")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(qualList.contains("B.Sc."));
            assertTrue(qualList.contains("M.Sc."));

            mockMvc.perform(delete("/api/staff-members/" + staffId + "/qualifications/" + qual1Id)
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isNoContent());

            String qualListAfterDelete = mockMvc.perform(get("/api/staff-members/" + staffId + "/qualifications")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(qualListAfterDelete.contains("B.Sc."));
            assertTrue(qualListAfterDelete.contains("M.Sc."));

            // Institution B must not see institution A's staff member.
            String listForB = mockMvc.perform(get("/api/staff-members")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listForB.contains(staffId));

            // Disciplinary: invalid actionType rejected.
            mockMvc.perform(post("/api/staff-members/" + staffId + "/disciplinary-records")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"actionType\":\"BOGUS\",\"reason\":\"test\"}"))
                    .andExpect(status().isBadRequest());

            // A WARNING is logged but doesn't change standing.
            mockMvc.perform(post("/api/staff-members/" + staffId + "/disciplinary-records")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"actionType\":\"WARNING\",\"reason\":\"Late to three consecutive lectures\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.actionType").value("WARNING"));
            mockMvc.perform(get("/api/staff-members/" + staffId)
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(jsonPath("$.disciplinaryStatus").value("NONE"));

            // A SUSPENSION changes standing; REINSTATEMENT clears it.
            mockMvc.perform(post("/api/staff-members/" + staffId + "/disciplinary-records")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"actionType\":\"SUSPENSION\",\"reason\":\"Unauthorized absence\"}"))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/staff-members/" + staffId)
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(jsonPath("$.disciplinaryStatus").value("SUSPENDED"));
            mockMvc.perform(post("/api/staff-members/" + staffId + "/disciplinary-records")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"actionType\":\"REINSTATEMENT\",\"reason\":\"Investigation concluded\"}"))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/staff-members/" + staffId)
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(jsonPath("$.disciplinaryStatus").value("NONE"));

            String disciplinaryHistory = mockMvc.perform(get("/api/staff-members/" + staffId + "/disciplinary-records")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(disciplinaryHistory.contains("WARNING"));
            assertTrue(disciplinaryHistory.contains("SUSPENSION"));
            assertTrue(disciplinaryHistory.contains("REINSTATEMENT"));

            // CSV import: one valid row, one duplicate-staffId row, one bad-FK row.
            String csv = "staffId,roleId,designationId,departmentId,gender,firstName,middleName,lastName,otherName,"
                    + "maritalStatus,email,phone,emergencyContact,dateOfBirth,employmentStartDate,contactAddress\n"
                    + "SU-CSV-" + shortSuffix + "," + lecturerDesigAId + "," + hodDesigAId + "," + departmentAId
                    + ",Female,Csv,,Imported,,Single,csv.imported@staff.test,08011112222,08011112223,"
                    + "1990-05-05T00:00:00Z,2021-06-01T00:00:00Z,2 CSV Street\n"
                    + "SU-STAFF-" + shortSuffix + "," + lecturerDesigAId + "," + hodDesigAId + "," + departmentAId
                    + ",Female,Dup,,Staff,,Single,dup@staff.test,08011112222,08011112223,"
                    + "1990-05-05T00:00:00Z,2021-06-01T00:00:00Z,2 CSV Street\n"
                    + "SU-BADFK-" + shortSuffix + ",does-not-exist," + hodDesigAId + "," + departmentAId
                    + ",Female,Bad,,Fk,,Single,badfk@staff.test,08011112222,08011112223,"
                    + "1990-05-05T00:00:00Z,2021-06-01T00:00:00Z,2 CSV Street\n";
            MockMultipartFile csvFile = new MockMultipartFile(
                    "file", "staff-members.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));
            mockMvc.perform(multipart("/api/staff-members/import")
                    .file(csvFile)
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.imported").value(1))
                    .andExpect(jsonPath("$.skipped").value(2));

            // CSV export.
            String csvExport = mockMvc.perform(get("/api/staff-members/export")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(result -> assertTrue(
                            result.getResponse().getContentType().startsWith("text/csv")))
                    .andReturn().getResponse().getContentAsString();
            assertTrue(csvExport.contains("SU-STAFF-" + shortSuffix));
            assertTrue(csvExport.contains("SU-CSV-" + shortSuffix));

            // Archive + restore round trip.
            mockMvc.perform(post("/api/staff-members/" + staffId + "/archive")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            String listWithoutArchived = mockMvc.perform(get("/api/staff-members")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listWithoutArchived.contains(staffId));
            mockMvc.perform(post("/api/staff-members/" + staffId + "/restore")
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

    private String staffBody(String staffId, String roleId, String designationId, String departmentId) {
        return """
                {"staffId":"%s","roleId":"%s","designationId":"%s","departmentId":"%s",
                 "gender":"Male","firstName":"Test","lastName":"Staff","maritalStatus":"Single",
                 "email":"test.staff.%s@staff.test","phone":"08022223333",
                 "emergencyContact":"08022223334","dateOfBirth":"1988-03-03T00:00:00Z",
                 "employmentStartDate":"2019-09-01T00:00:00Z","contactAddress":"9 Staff Avenue"}
                """.formatted(staffId, roleId, designationId, departmentId, staffId);
    }

    private String createDesignation(String token, String name, String category) throws Exception {
        String response = mockMvc.perform(post("/api/staff-designations")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"description\":\"desc\",\"category\":\"" + category + "\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
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
                         "adminUser":"Test Admin","adminEmail":"admin@stafftestuniversity.edu.ng"}
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
                        {"firstName":"Staff","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"StaffTest@2026",
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
