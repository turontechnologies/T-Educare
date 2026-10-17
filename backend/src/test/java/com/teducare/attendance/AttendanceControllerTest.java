package com.teducare.attendance;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AttendanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullAttendanceLifecycleWithDeviceAuthAndSelfServiceIsolation() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionId = createInstitution(superToken, "Attendance Test University " + suffix);
        String institutionBId = createInstitution(superToken, "Attendance Test University B " + suffix);
        String username = "attendance_admin_" + suffix;
        String usernameB = "attendance_admin_b_" + suffix;
        String userManagerId = null;
        String userManagerBId = null;

        try {
            userManagerId = createUserManager(superToken, institutionId, username, "attendance_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "attendance_b_" + suffix);
            String token = loginAs(username, "AttendanceTest@2026");
            String tokenB = loginAs(usernameB, "AttendanceTest@2026");

            String schoolId = createSchool(token, "School of Attendance Test");
            String facultyId = createFaculty(token, "Faculty of Attendance Test", schoolId);
            String departmentId = createDepartment(token, "Dept of Attendance Test", facultyId, schoolId);
            String designationId = createDesignation(token, "Clerk-" + suffix, "Non-Academic Staff");

            String staffACode = "ATT-" + suffix + "-A";
            String staffBCode = "ATT-" + suffix + "-B";
            String staffCCode = "ATT-" + suffix + "-C";
            String staffAId = createStaffMember(token, staffACode, designationId, departmentId);
            String staffBId = createStaffMember(token, staffBCode, designationId, departmentId);
            createStaffMember(token, staffCCode, designationId, departmentId);

            // --- Settings: defaults, then update, then validation ---
            mockMvc.perform(get("/api/attendance/settings").header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.resumptionTime").value("08:00"));

            DayOfWeek today = LocalDate.now().getDayOfWeek();
            String allDaysButExcluded = Arrays.stream(DayOfWeek.values())
                    .filter(d -> d != today)
                    .map(Enum::name)
                    .collect(Collectors.joining(","));

            mockMvc.perform(patch("/api/attendance/settings")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"resumptionTime\":\"06:00\",\"gracePeriodMinutes\":0}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.resumptionTime").value("06:00"))
                    .andExpect(jsonPath("$.gracePeriodMinutes").value(0));

            mockMvc.perform(patch("/api/attendance/settings")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"resumptionTime\":\"not-a-time\"}"))
                    .andExpect(status().isBadRequest());

            // Every day is a workday for the deterministic PRESENT/LATE checks below —
            // the suite can run on any real calendar day, and the default Mon-Fri
            // setting would otherwise make "today" a non-workday on a weekend run.
            mockMvc.perform(patch("/api/attendance/settings")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"workdays\":[\"MONDAY\",\"TUESDAY\",\"WEDNESDAY\",\"THURSDAY\",\"FRIDAY\","
                            + "\"SATURDAY\",\"SUNDAY\"]}"))
                    .andExpect(status().isOk());

            // --- Devices: create, list, cross-institution isolation ---
            String deviceResponse = mockMvc.perform(post("/api/attendance/devices")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Main Gate Scanner\",\"location\":\"Main Gate\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.apiKey").exists())
                    .andExpect(jsonPath("$.device.name").value("Main Gate Scanner"))
                    .andReturn().getResponse().getContentAsString();
            String deviceId = deviceResponse.split("\"id\":\"")[1].split("\"")[0];
            String apiKey = deviceResponse.split("\"apiKey\":\"")[1].split("\"")[0];

            String listForB = mockMvc.perform(get("/api/attendance/devices")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listForB.contains(deviceId));

            // --- Device clock-event push: wrong key rejected, valid key accepted ---
            String todayMorning = LocalDate.now() + "T05:55:00Z"; // before 06:00 cutoff -> PRESENT
            mockMvc.perform(post("/api/attendance/clock-events")
                    .header("X-Device-Api-Key", "wrong-key")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"staffId\":\"" + staffACode + "\",\"eventType\":\"CLOCK_IN\",\"occurredAt\":\""
                            + todayMorning + "\"}"))
                    .andExpect(status().isUnauthorized());

            mockMvc.perform(post("/api/attendance/clock-events")
                    .header("X-Device-Api-Key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"staffId\":\"" + staffACode + "\",\"eventType\":\"CLOCK_IN\",\"occurredAt\":\""
                            + todayMorning + "\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.source").value("DEVICE"));

            // Staff B clocks in late (after the 06:00 cutoff).
            String todayLate = LocalDate.now() + "T09:30:00Z";
            mockMvc.perform(post("/api/attendance/clock-events")
                    .header("X-Device-Api-Key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"staffId\":\"" + staffBCode + "\",\"eventType\":\"CLOCK_IN\",\"occurredAt\":\""
                            + todayLate + "\"}"))
                    .andExpect(status().isCreated());

            // --- Manual entry (admin-recorded, requires a note) ---
            mockMvc.perform(post("/api/attendance/manual-entries")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"staffId\":\"" + staffACode + "\",\"eventType\":\"CLOCK_OUT\",\"occurredAt\":\""
                            + LocalDate.now() + "T17:00:00Z\",\"note\":\"Device offline, recorded by admin\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.source").value("MANUAL"));

            // --- Overview: staff A present, staff B late, staff C not yet clocked in ---
            String overview = mockMvc.perform(get("/api/attendance/overview")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.workday").value(true))
                    .andExpect(jsonPath("$.totalStaff").value(3))
                    .andExpect(jsonPath("$.presentCount").value(1))
                    .andExpect(jsonPath("$.lateCount").value(1))
                    .andExpect(jsonPath("$.notClockedInCount").value(1))
                    .andReturn().getResponse().getContentAsString();
            assertTrue(overview.contains(staffACode));
            assertTrue(overview.contains(staffBCode));

            // --- Staff history: a past date with no events is ABSENT on a workday ---
            String pastDate = LocalDate.now().minusDays(30).toString();
            mockMvc.perform(get("/api/attendance/staff/" + staffAId + "/history")
                    .header("Authorization", "Bearer " + token)
                    .param("from", pastDate)
                    .param("to", pastDate))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("ABSENT"));

            // --- Non-workday: excluding today from workdays makes the overview read NON_WORKDAY ---
            mockMvc.perform(patch("/api/attendance/settings")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"workdays\":[" + Arrays.stream(allDaysButExcluded.split(","))
                            .map(d -> "\"" + d + "\"").collect(Collectors.joining(",")) + "]}"))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/attendance/overview")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.workday").value(false));
            // Restore all 7 days so the self-service checks below are deterministic regardless of weekday.
            mockMvc.perform(patch("/api/attendance/settings")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"workdays\":[\"MONDAY\",\"TUESDAY\",\"WEDNESDAY\",\"THURSDAY\",\"FRIDAY\","
                            + "\"SATURDAY\",\"SUNDAY\"]}"))
                    .andExpect(status().isOk());

            // --- Device revoke: further clock-events with its key are rejected ---
            mockMvc.perform(delete("/api/attendance/devices/" + deviceId)
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("revoked"));
            mockMvc.perform(post("/api/attendance/clock-events")
                    .header("X-Device-Api-Key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"staffId\":\"" + staffACode + "\",\"eventType\":\"CLOCK_IN\"}"))
                    .andExpect(status().isUnauthorized());

            // --- Self-service: an unlinked account is forbidden; a linked one sees only its own data ---
            mockMvc.perform(get("/api/attendance/my/today").header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());

            mockMvc.perform(patch("/api/user-managers/" + userManagerId)
                    .header("Authorization", "Bearer " + superToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"staffId\":\"" + staffAId + "\"}"))
                    .andExpect(status().isOk());
            String linkedToken = loginAs(username, "AttendanceTest@2026");

            String myHistory = mockMvc.perform(get("/api/attendance/my/today")
                    .header("Authorization", "Bearer " + linkedToken))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(myHistory.contains(staffACode));
            assertFalse(myHistory.contains(staffBCode));
        } finally {
            if (userManagerId != null) {
                mockMvc.perform(post("/api/user-managers/" + userManagerId + "/archive")
                        .header("Authorization", "Bearer " + superToken));
            }
            if (userManagerBId != null) {
                mockMvc.perform(post("/api/user-managers/" + userManagerBId + "/archive")
                        .header("Authorization", "Bearer " + superToken));
            }
            mockMvc.perform(post("/api/institutions/" + institutionId + "/archive")
                    .header("Authorization", "Bearer " + superToken));
            mockMvc.perform(post("/api/institutions/" + institutionBId + "/archive")
                    .header("Authorization", "Bearer " + superToken));
        }
    }

    private String createStaffMember(String token, String staffId, String designationId, String departmentId)
            throws Exception {
        String response = mockMvc.perform(post("/api/staff-members")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"staffId":"%s","roleId":"%s","designationId":"%s","departmentId":"%s",
                         "gender":"Male","firstName":"Attendance","lastName":"Tester","maritalStatus":"Single",
                         "email":"attendance.%s@staff.test","phone":"08033334444",
                         "emergencyContact":"08033334445","dateOfBirth":"1990-01-01T00:00:00Z",
                         "employmentStartDate":"2020-01-01T00:00:00Z","contactAddress":"1 Attendance Lane"}
                        """.formatted(staffId, designationId, designationId, departmentId, staffId))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
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
                         "adminUser":"Test Admin","adminEmail":"admin@attendancetestuniversity.edu.ng"}
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
                        {"firstName":"Attendance","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"AttendanceTest@2026",
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
