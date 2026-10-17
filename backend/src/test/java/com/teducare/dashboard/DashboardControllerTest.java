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
    void superAdminStatsAreRealAggregatesNotHardcoded() throws Exception {
        String token = loginAs("super_admin", "Super@2024");

        String before = mockMvc.perform(get("/api/super-admin/stats")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.institutionsCount").isNumber())
                .andExpect(jsonPath("$.totalStudents").isNumber())
                .andExpect(jsonPath("$.totalRevenue").isNumber())
                .andReturn()
                .getResponse()
                .getContentAsString();
        long institutionsBefore = Long.parseLong(before.split("\"institutionsCount\":")[1].split("[,}]")[0]);
        long studentsBefore = Long.parseLong(before.split("\"totalStudents\":")[1].split("[,}]")[0]);

        // Creating a real institution with a known studentCount (0, per
        // CreateInstitutionRequest's defaults) must bump institutionsCount by
        // exactly 1 and leave totalStudents unchanged — proving these are
        // genuinely recomputed aggregates, not a fixed number.
        String createResponse = mockMvc.perform(post("/api/institutions")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Dashboard Stats Test University","institutionType":"University",
                         "adminUser":"Test Admin","adminEmail":"admin@dashboardstatstestuni.edu.ng"}
                        """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String institutionId = createResponse.split("\"id\":\"")[1].split("\"")[0];

        try {
            mockMvc.perform(get("/api/super-admin/stats")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.institutionsCount").value(institutionsBefore + 1))
                    .andExpect(jsonPath("$.totalStudents").value(studentsBefore));
        } finally {
            mockMvc.perform(post("/api/institutions/" + institutionId + "/archive")
                    .header("Authorization", "Bearer " + token));
        }

        // Archiving must bring institutionsCount back down — confirms archived
        // institutions are correctly excluded from the "active" aggregate.
        mockMvc.perform(get("/api/super-admin/stats")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.institutionsCount").value(institutionsBefore));
    }

    @Test
    void institutionAdminDashboardStatsAreRealLiveCountsNotTheDeadInstitutionColumns() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionId = createInstitution(superToken, "Dashboard Live Stats University " + suffix);
        String username = "dash_admin_" + suffix;
        String userManagerId = null;

        try {
            userManagerId = createUserManager(superToken, institutionId, username, "dash_" + suffix);
            String token = loginAs(username, "DashTest@2026");

            // A freshly created institution has zero of everything — proves
            // these are live counts, not some nonzero seeded/cached value.
            mockMvc.perform(get("/api/dashboard/stats")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.registeredStudents").value(0))
                    .andExpect(jsonPath("$.lecturers").value(0))
                    .andExpect(jsonPath("$.applicants").value(0))
                    .andExpect(jsonPath("$.accumulatedProfit").value(0));

            String schoolId = createSchool(token, "School of Dashboard Test");
            String facultyId = createFaculty(token, "Faculty of Dashboard Test", schoolId);
            String departmentId = createDepartment(token, "Dept of Dashboard Test", facultyId, schoolId);
            String programId = createProgram(token, "Program of Dashboard Test", departmentId, facultyId);
            String levelId = createProgramLevel(token, "100L-" + suffix);
            String sessionId = createAcademicSession(token, "26/27-" + suffix.substring(suffix.length() - 6));

            createStudent(token, "Chinedu", "Okafor", "chinedu." + suffix,
                    schoolId, facultyId, departmentId, programId, levelId, sessionId);
            createStudent(token, "Amina", "Bello", "amina." + suffix,
                    schoolId, facultyId, departmentId, programId, levelId, sessionId);
            createLecturer(token, "UL-" + suffix, schoolId);

            // Real counts now reflect the 2 students + 1 lecturer just created
            // — the exact regression this fix targets: these used to read
            // Institution.studentCount/revenue, which are set to 0 once at
            // creation and never updated by any real write path, so they
            // never moved no matter how many real students/lecturers existed.
            mockMvc.perform(get("/api/dashboard/stats")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.registeredStudents").value(2))
                    .andExpect(jsonPath("$.lecturers").value(1))
                    .andExpect(jsonPath("$.applicants").value(0))
                    .andExpect(jsonPath("$.accumulatedProfit").value(0));

            // Enrollment ("day" range) sums to the 2 students created just now.
            String enrollment = mockMvc.perform(get("/api/dashboard/enrollment")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data.length()").value(14))
                    .andReturn().getResponse().getContentAsString();
            long total = java.util.regex.Pattern.compile("\"value\":(\\d+)")
                    .matcher(enrollment)
                    .results()
                    .mapToLong(m -> Long.parseLong(m.group(1)))
                    .sum();
            org.junit.jupiter.api.Assertions.assertEquals(2, total);

            // Recent students — real, newest first (Amina was created after Chinedu).
            mockMvc.perform(get("/api/dashboard/recent-students")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].name").value("Amina Bello"))
                    .andExpect(jsonPath("$.data[1].name").value("Chinedu Okafor"));
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
    void recentInstitutionsEndpointReturnsLatestInstitutions() throws Exception {
        String token = loginAs("super_admin", "Super@2024");

        mockMvc.perform(get("/api/super-admin/recent-institutions")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").exists())
                .andExpect(jsonPath("$.data[0].modulesCount").isNumber())
                .andExpect(jsonPath("$.data[0].createdAt").exists())
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
