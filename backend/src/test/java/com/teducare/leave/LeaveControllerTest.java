package com.teducare.leave;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class LeaveControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullLeaveLifecycleWithApprovalBalanceResumptionAndAttendanceIntegration() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionId = createInstitution(superToken, "Leave Test University " + suffix);
        String institutionBId = createInstitution(superToken, "Leave Test University B " + suffix);
        String username = "leave_admin_" + suffix;
        String usernameB = "leave_admin_b_" + suffix;
        String userManagerId = null;
        String userManagerBId = null;

        try {
            userManagerId = createUserManager(superToken, institutionId, username, "leave_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "leave_b_" + suffix);
            String token = loginAs(username, "LeaveTest@2026");
            String tokenB = loginAs(usernameB, "LeaveTest@2026");

            String schoolId = createSchool(token, "School of Leave Test");
            String facultyId = createFaculty(token, "Faculty of Leave Test", schoolId);
            String departmentId = createDepartment(token, "Dept of Leave Test", facultyId, schoolId);
            String designationId = createDesignation(token, "Officer-" + suffix, "Non-Academic Staff");
            String staffACode = "LV-" + suffix + "-A";
            String staffAId = createStaffMember(token, staffACode, designationId, departmentId);

            // Deterministic regardless of real calendar day — same pattern as AttendanceControllerTest.
            mockMvc.perform(patch("/api/attendance/settings")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"workdays\":[\"MONDAY\",\"TUESDAY\",\"WEDNESDAY\",\"THURSDAY\",\"FRIDAY\","
                            + "\"SATURDAY\",\"SUNDAY\"]}"))
                    .andExpect(status().isOk());

            // --- Leave type: create, duplicate name rejected, cross-institution isolation ---
            String typeResponse = mockMvc.perform(post("/api/leave/types")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Annual Leave\",\"defaultDaysPerYear\":10,\"rollover\":true,\"maxRolloverDays\":5}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.defaultDaysPerYear").value(10))
                    .andExpect(jsonPath("$.rollover").value(true))
                    .andReturn().getResponse().getContentAsString();
            String leaveTypeId = typeResponse.split("\"id\":\"")[1].split("\"")[0];

            mockMvc.perform(post("/api/leave/types")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"annual leave\",\"defaultDaysPerYear\":5}"))
                    .andExpect(status().isConflict());

            String typesForB = mockMvc.perform(get("/api/leave/types").header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(typesForB.contains(leaveTypeId));

            // --- Link staffA's login for self-service ---
            mockMvc.perform(patch("/api/user-managers/" + userManagerId)
                    .header("Authorization", "Bearer " + superToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"staffId\":\"" + staffAId + "\"}"))
                    .andExpect(status().isOk());
            String linkedToken = loginAs(username, "LeaveTest@2026");

            // --- Self-service: sees the active type, submits a request ---
            String myTypes = mockMvc.perform(get("/api/leave/my/types").header("Authorization", "Bearer " + linkedToken))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(myTypes.contains("Annual Leave"));

            String start = LocalDate.now().toString();
            String end = LocalDate.now().plusDays(2).toString();
            String requestResponse = mockMvc.perform(post("/api/leave/my/requests")
                    .header("Authorization", "Bearer " + linkedToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"leaveTypeId\":\"" + leaveTypeId + "\",\"startDate\":\"" + start
                            + "\",\"endDate\":\"" + end + "\",\"reason\":\"Family event\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.status").value("PENDING"))
                    .andExpect(jsonPath("$.totalDays").value(3))
                    .andExpect(jsonPath("$.staffCode").value(staffACode))
                    .andReturn().getResponse().getContentAsString();
            String requestId = requestResponse.split("\"id\":\"")[1].split("\"")[0];

            // Overlapping second request on the same dates is rejected.
            mockMvc.perform(post("/api/leave/my/requests")
                    .header("Authorization", "Bearer " + linkedToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"leaveTypeId\":\"" + leaveTypeId + "\",\"startDate\":\"" + start
                            + "\",\"endDate\":\"" + end + "\",\"reason\":\"Duplicate\"}"))
                    .andExpect(status().isConflict());

            // Balance before approval: still 10/10, nothing used yet (only APPROVED requests count).
            mockMvc.perform(get("/api/leave/my/balance").header("Authorization", "Bearer " + linkedToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].allocatedDays").value(10))
                    .andExpect(jsonPath("$[0].usedDays").value(0))
                    .andExpect(jsonPath("$[0].remainingDays").value(10));

            // --- Admin: sees it pending, reject requires a reason, then approve ---
            mockMvc.perform(get("/api/leave/requests?status=PENDING").header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(requestId));

            mockMvc.perform(post("/api/leave/requests/" + requestId + "/reject")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().isBadRequest());

            mockMvc.perform(post("/api/leave/requests/" + requestId + "/approve")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"note\":\"Approved, enjoy\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("APPROVED"));

            // Approving twice is rejected — already reviewed.
            mockMvc.perform(post("/api/leave/requests/" + requestId + "/approve")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isBadRequest());

            // Balance after approval: 3 days used, 7 remaining.
            mockMvc.perform(get("/api/leave/my/balance").header("Authorization", "Bearer " + linkedToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].usedDays").value(3))
                    .andExpect(jsonPath("$[0].remainingDays").value(7));

            // --- Attendance integration: a day inside the approved leave range reads ON_LEAVE, not ABSENT/NOT_CLOCKED_IN ---
            mockMvc.perform(get("/api/attendance/staff/" + staffAId + "/history")
                    .header("Authorization", "Bearer " + token)
                    .param("from", start)
                    .param("to", start))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].status").value("ON_LEAVE"))
                    .andExpect(jsonPath("$[0].leaveTypeName").value("Annual Leave"));

            mockMvc.perform(get("/api/attendance/overview")
                    .header("Authorization", "Bearer " + token)
                    .param("date", start))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.onLeaveCount").value(1));

            // --- Self-service: resumption report, then a second one is rejected ---
            mockMvc.perform(post("/api/leave/my/requests/" + requestId + "/resume")
                    .header("Authorization", "Bearer " + linkedToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"note\":\"Back at work, handover complete.\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.resumedAt").exists())
                    .andExpect(jsonPath("$.resumptionNote").value("Back at work, handover complete."));

            mockMvc.perform(post("/api/leave/my/requests/" + requestId + "/resume")
                    .header("Authorization", "Bearer " + linkedToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"note\":\"Again\"}"))
                    .andExpect(status().isBadRequest());

            // --- A fresh non-overlapping request can be cancelled by its own staff member ---
            String laterStart = LocalDate.now().plusDays(30).toString();
            String laterEnd = LocalDate.now().plusDays(31).toString();
            String secondRequestResponse = mockMvc.perform(post("/api/leave/my/requests")
                    .header("Authorization", "Bearer " + linkedToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"leaveTypeId\":\"" + leaveTypeId + "\",\"startDate\":\"" + laterStart
                            + "\",\"endDate\":\"" + laterEnd + "\",\"reason\":\"Trip\"}"))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            String secondRequestId = secondRequestResponse.split("\"id\":\"")[1].split("\"")[0];

            mockMvc.perform(post("/api/leave/my/requests/" + secondRequestId + "/cancel")
                    .header("Authorization", "Bearer " + linkedToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("CANCELLED"));

            // --- Admin balances overview lists this staff member ---
            String balances = mockMvc.perform(get("/api/leave/balances").header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(balances.contains(staffACode));

            // --- Requesting against an archived leave type is rejected ---
            mockMvc.perform(post("/api/leave/types/" + leaveTypeId + "/archive")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            mockMvc.perform(post("/api/leave/my/requests")
                    .header("Authorization", "Bearer " + linkedToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"leaveTypeId\":\"" + leaveTypeId + "\",\"startDate\":\"" + laterStart
                            + "\",\"endDate\":\"" + laterEnd + "\",\"reason\":\"Should fail\"}"))
                    .andExpect(status().isBadRequest());
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
                         "gender":"Male","firstName":"Leave","lastName":"Tester","maritalStatus":"Single",
                         "email":"leave.%s@staff.test","phone":"08033334444",
                         "emergencyContact":"08033334445","dateOfBirth":"1990-01-01T00:00:00Z",
                         "employmentStartDate":"2020-01-01T00:00:00Z","contactAddress":"1 Leave Lane"}
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
                         "adminUser":"Test Admin","adminEmail":"admin@leavetestuniversity.edu.ng"}
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
                        {"firstName":"Leave","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"LeaveTest@2026",
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
