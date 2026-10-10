package com.teducare.registration;

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
class CourseRegistrationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void carryoverFirstRuleUnitCapAndDepartmentLevelEligibilityAreEnforced() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionId = createInstitution(superToken, "Course Reg Test University " + suffix);
        String username = "coursereg_admin_" + suffix;
        String userManagerId = null;

        try {
            userManagerId = createUserManager(superToken, institutionId, username, "coursereg_" + suffix);
            String token = loginAs(username, "CourseRegTest@2026");

            String schoolId = createSchool(token, "School of Course Reg Test");
            String facultyId = createFaculty(token, "Faculty of Course Reg Test", schoolId);
            String departmentId = createDepartment(token, "Dept of Course Reg Test", facultyId, schoolId);
            String otherDepartmentId = createDepartment(token, "Other Dept of Course Reg Test", facultyId, schoolId);
            String programId = createProgram(token, "Program of Course Reg Test", departmentId, facultyId);
            String shortSuffix = suffix.substring(suffix.length() - 6);
            String level100Id = createProgramLevel(token, "1L-" + shortSuffix);
            String level200Id = createProgramLevel(token, "2L-" + shortSuffix);
            String sessionId = createAcademicSession(token, "26/27-" + shortSuffix);
            String semesterId = createAcademicSemester(token, sessionId, "First Semester CR " + suffix);

            String course100Id = createCourse(token, "Intro to Programming", "CSC101-" + suffix, departmentId, level100Id, 3);
            String course200Id = createCourse(token, "Data Structures", "CSC201-" + suffix, departmentId, level200Id, 4);
            String wrongDeptCourseId =
                    createCourse(token, "Unrelated Course", "UNR101-" + suffix, otherDepartmentId, level100Id, 2);

            String studentId = createStudent(
                    token, "chinedu.cr." + suffix, schoolId, facultyId, departmentId, programId, level100Id, sessionId);

            // --- Register the 100L course while student is at 100L: succeeds. ---
            mockMvc.perform(put("/api/course-registrations")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"studentId\":\"" + studentId + "\",\"academicSemesterId\":\"" + semesterId
                            + "\",\"courseIds\":[\"" + course100Id + "\"]}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].unitSnapshot").value(3))
                    .andExpect(jsonPath("$[0].isCarryover").value(false));

            // --- A course from a different department is rejected. ---
            mockMvc.perform(put("/api/course-registrations")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"studentId\":\"" + studentId + "\",\"academicSemesterId\":\"" + semesterId
                            + "\",\"courseIds\":[\"" + wrongDeptCourseId + "\"]}"))
                    .andExpect(status().isBadRequest());

            // --- Promote the student to 200L, leaving the 100L course as an outstanding carryover. ---
            mockMvc.perform(post("/api/students/" + studentId + "/academic-history")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"academicSessionId\":\"" + sessionId + "\",\"programLevelId\":\"" + level200Id
                            + "\",\"status\":\"current\",\"carryoverCourseIds\":[\"" + course100Id + "\"]}"))
                    .andExpect(status().isOk());

            // --- A 200L-only new semester's registration (default policy: carryover clearance required) is rejected
            // when it doesn't include the outstanding carryover course. ---
            String newSemesterId = createAcademicSemester(token, sessionId, "Second Semester CR " + suffix);
            mockMvc.perform(put("/api/course-registrations")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"studentId\":\"" + studentId + "\",\"academicSemesterId\":\"" + newSemesterId
                            + "\",\"courseIds\":[\"" + course200Id + "\"]}"))
                    .andExpect(status().isBadRequest());

            // --- Including the carryover course alongside the new-level course succeeds; isCarryover flag is correct. ---
            String replaceResponse = mockMvc.perform(put("/api/course-registrations")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"studentId\":\"" + studentId + "\",\"academicSemesterId\":\"" + newSemesterId
                            + "\",\"courseIds\":[\"" + course100Id + "\",\"" + course200Id + "\"]}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andReturn().getResponse().getContentAsString();
            assertTrue(replaceResponse.contains("\"isCarryover\":true"));

            // --- GET reflects the current registrations for that semester. ---
            mockMvc.perform(get("/api/course-registrations")
                    .header("Authorization", "Bearer " + token)
                    .param("studentId", studentId)
                    .param("academicSemesterId", newSemesterId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));

            // --- Unit cap: lower the cap below this student's total, then confirm rejection. ---
            mockMvc.perform(put("/api/registration-settings")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"requireCarryoverClearance\":true,\"maxUnitsPerSemester\":5}"))
                    .andExpect(status().isOk());

            mockMvc.perform(put("/api/course-registrations")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"studentId\":\"" + studentId + "\",\"academicSemesterId\":\"" + newSemesterId
                            + "\",\"courseIds\":[\"" + course100Id + "\",\"" + course200Id + "\"]}"))
                    .andExpect(status().isBadRequest());

            // --- Turning off carryover clearance allows registering the new-level course alone. ---
            mockMvc.perform(put("/api/registration-settings")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"requireCarryoverClearance\":false,\"maxUnitsPerSemester\":24}"))
                    .andExpect(status().isOk());

            mockMvc.perform(put("/api/course-registrations")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"studentId\":\"" + studentId + "\",\"academicSemesterId\":\"" + newSemesterId
                            + "\",\"courseIds\":[\"" + course200Id + "\"]}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1));
        } finally {
            if (userManagerId != null) {
                mockMvc.perform(post("/api/user-managers/" + userManagerId + "/archive")
                        .header("Authorization", "Bearer " + superToken));
            }
            mockMvc.perform(post("/api/institutions/" + institutionId + "/archive")
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

    private String createProgram(String token, String name, String departmentId, String facultyId) throws Exception {
        String response = mockMvc.perform(post("/api/programs")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"departmentId\":\"" + departmentId + "\",\"facultyId\":\""
                        + facultyId + "\",\"programType\":\"Undergraduate\"}"))
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

    private String createAcademicSession(String token, String session) throws Exception {
        String response = mockMvc.perform(post("/api/academic-sessions")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"session\":\"" + session + "\",\"from\":\"2026-09-01T00:00:00.000Z\","
                        + "\"to\":\"2027-07-31T00:00:00.000Z\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createAcademicSemester(String token, String sessionId, String name) throws Exception {
        String response = mockMvc.perform(post("/api/academic-semesters")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sessionId\":\"" + sessionId + "\",\"name\":\"" + name
                        + "\",\"from\":\"2026-09-01T00:00:00.000Z\",\"to\":\"2027-01-31T00:00:00.000Z\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createCourse(
            String token, String name, String code, String departmentId, String programLevelId, int unit)
            throws Exception {
        String schoolIdForCourse = createSchool(token, "School for " + code);
        String response = mockMvc.perform(post("/api/courses")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"code\":\"" + code + "\",\"departmentId\":\"" + departmentId
                        + "\",\"schoolId\":\"" + schoolIdForCourse + "\",\"programLevelId\":\"" + programLevelId
                        + "\",\"unit\":" + unit + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createStudent(
            String token,
            String emailPrefix,
            String schoolId,
            String facultyId,
            String departmentId,
            String programId,
            String programLevelId,
            String sessionId)
            throws Exception {
        String response = mockMvc.perform(post("/api/students")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"title":"Mr","firstName":"Chinedu","lastName":"Okafor",
                         "gender":"Male","maritalStatus":"Single","email":"%s@example.com",
                         "phone":"08011112222","emergencyContact":"08099990000",
                         "dateOfBirth":"2004-05-10T00:00:00.000Z","religion":"Christian",
                         "bloodGroup":"O+","genotype":"AA","weightKg":68.5,"heightCm":175.0,
                         "nationality":"Nigerian","stateOfOrigin":"Anambra","lga":"Awka North",
                         "residentAddress":"12 Unity Road","schoolId":"%s","facultyId":"%s",
                         "departmentId":"%s","programId":"%s","programLevelId":"%s","currentSessionId":"%s",
                         "admissionMode":"UTME"}
                        """.formatted(emailPrefix, schoolId, facultyId, departmentId, programId, programLevelId, sessionId)))
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
                         "adminUser":"Test Admin","adminEmail":"admin@coursereguniversity.edu.ng"}
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
                        {"firstName":"CourseReg","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"CourseRegTest@2026",
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
