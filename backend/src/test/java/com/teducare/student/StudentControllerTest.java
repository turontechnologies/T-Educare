package com.teducare.student;

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
class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullStudentLifecycleIncludingPreStudentMedicalDisciplinaryAndCaseRecords() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionId = createInstitution(superToken, "Student Test University " + suffix);
        String username = "student_admin_" + suffix;
        String userManagerId = null;

        try {
            userManagerId = createUserManager(superToken, institutionId, username, "student_" + suffix);
            String token = loginAs(username, "StudentTest@2026");

            String schoolId = createSchool(token, "School of Student Test");
            String facultyId = createFaculty(token, "Faculty of Student Test", schoolId);
            String departmentId = createDepartment(token, "Dept of Student Test", facultyId, schoolId);
            String programId = createProgram(token, "Program of Student Test", departmentId, facultyId);
            String shortSuffix = suffix.substring(suffix.length() - 6);
            String levelId = createProgramLevel(token, "100L-" + suffix);
            String nextLevelId = createProgramLevel(token, "200L-" + suffix);
            String sessionId = createAcademicSession(token, "26/27-" + shortSuffix);

            // --- Create a pre-student: no matricNo at all. ---
            String createBody = """
                    {"title":"Mr","firstName":"Chinedu","lastName":"Okafor",
                     "gender":"Male","maritalStatus":"Single","email":"chinedu.%s@example.com",
                     "phone":"08011112222","emergencyContact":"08099990000",
                     "dateOfBirth":"2004-05-10T00:00:00.000Z","religion":"Christian",
                     "bloodGroup":"O+","genotype":"AA","weightKg":68.5,"heightCm":175.0,
                     "nationality":"Nigerian","stateOfOrigin":"Anambra","lga":"Awka North",
                     "residentAddress":"12 Unity Road","schoolId":"%s","facultyId":"%s",
                     "departmentId":"%s","programId":"%s","programLevelId":"%s","currentSessionId":"%s",
                     "allergies":"Penicillin","chronicConditions":"Asthma",
                     "physicianName":"Dr. Ade","physicianPhone":"08055556666"}
                    """.formatted(suffix, schoolId, facultyId, departmentId, programId, levelId, sessionId);

            String createResponse = mockMvc.perform(post("/api/students")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(createBody))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.matricNo").doesNotExist())
                    .andExpect(jsonPath("$.firstName").value("Chinedu"))
                    .andExpect(jsonPath("$.disciplinaryStatus").value("NONE"))
                    .andExpect(jsonPath("$.allergies").value("Penicillin"))
                    .andReturn().getResponse().getContentAsString();
            String studentId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // Bad FK (programId from nowhere) rejected.
            mockMvc.perform(post("/api/students")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(createBody.replace(programId, "does-not-exist")))
                    .andExpect(status().isNotFound());

            // Invalid enum value rejected.
            mockMvc.perform(post("/api/students")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(createBody.replace("\"bloodGroup\":\"O+\"", "\"bloodGroup\":\"Z+\"")))
                    .andExpect(status().isBadRequest());

            // Regression: searching with a pre-student (matricNo == null)
            // present must not NPE while scanning matricNo for a match.
            mockMvc.perform(get("/api/students?search=okafor")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].firstName").value("Chinedu"));

            // Regression: creating a real (non-pre-student) student while a
            // pre-student (matricNo == null) already exists in the institution
            // must not NPE while scanning for a matricNo collision.
            mockMvc.perform(post("/api/students")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(createBody
                            .replace("chinedu.", "realstudent.")
                            .replace("\"gender\":\"Male\",", "\"matricNo\":\"UL-REG-" + suffix + "\",\"gender\":\"Male\",")))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.matricNo").value("UL-REG-" + suffix));

            // --- Pre-student becomes a student: assign a matric number via normal update. ---
            String matricNo = "UL-" + suffix;
            mockMvc.perform(patch("/api/students/" + studentId)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"matricNo\":\"" + matricNo + "\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.matricNo").value(matricNo));

            // Duplicate matric number (case-insensitive) rejected.
            String createBody2 = createBody.replace("chinedu.", "another.");
            String secondResponse = mockMvc.perform(post("/api/students")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(createBody2))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            String secondStudentId = secondResponse.split("\"id\":\"")[1].split("\"")[0];
            mockMvc.perform(patch("/api/students/" + secondStudentId)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"matricNo\":\"" + matricNo.toLowerCase() + "\"}"))
                    .andExpect(status().isConflict());

            // --- Academic history: add a promotion record, student's cached level/session move with it. ---
            mockMvc.perform(post("/api/students/" + studentId + "/academic-history")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"academicSessionId\":\"" + sessionId + "\",\"programLevelId\":\"" + nextLevelId
                            + "\",\"status\":\"current\",\"carryoverCourseIds\":[\"course-fake-1\"]}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.programLevelId").value(nextLevelId))
                    .andExpect(jsonPath("$.carryoverCourseIds[0]").value("course-fake-1"));

            mockMvc.perform(get("/api/students/" + studentId)
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.programLevelId").value(nextLevelId));

            String historyList = mockMvc.perform(get("/api/students/" + studentId + "/academic-history")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(historyList.contains("course-fake-1"));

            // --- Disciplinary: suspend, then reinstate. ---
            mockMvc.perform(post("/api/students/" + studentId + "/disciplinary-records")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"actionType\":\"SUSPENSION\",\"reason\":\"Exam malpractice.\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.actionType").value("SUSPENSION"))
                    .andExpect(jsonPath("$.actorId").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.emptyOrNullString())));

            mockMvc.perform(get("/api/students/" + studentId)
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.disciplinaryStatus").value("SUSPENDED"));

            mockMvc.perform(post("/api/students/" + studentId + "/disciplinary-records")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"actionType\":\"REINSTATEMENT\",\"reason\":\"Cleared by disciplinary committee.\"}"))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/students/" + studentId)
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.disciplinaryStatus").value("NONE"));

            String disciplinaryHistory = mockMvc.perform(get("/api/students/" + studentId + "/disciplinary-records")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(disciplinaryHistory.contains("SUSPENSION"));
            assertTrue(disciplinaryHistory.contains("REINSTATEMENT"));

            // --- Reported case: report then resolve. ---
            String caseResponse = mockMvc.perform(post("/api/students/" + studentId + "/cases")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"title\":\"Noise complaint\",\"description\":\"Reported by hostel warden.\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("open"))
                    .andReturn().getResponse().getContentAsString();
            String caseId = caseResponse.split("\"id\":\"")[1].split("\"")[0];

            mockMvc.perform(patch("/api/students/" + studentId + "/cases/" + caseId)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"resolved\",\"resolutionNotes\":\"Verbal warning issued.\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("resolved"))
                    .andExpect(jsonPath("$.resolvedAt").exists());

            String caseList = mockMvc.perform(get("/api/students/" + studentId + "/cases")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(caseList.contains("Noise complaint"));

            // --- Hostel fields round-trip via normal update. ---
            mockMvc.perform(patch("/api/students/" + studentId)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"hostelName\":\"Unity Hall\",\"roomNumber\":\"B12\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.hostelName").value("Unity Hall"))
                    .andExpect(jsonPath("$.roomNumber").value("B12"));

            // --- Search filters by programLevelId. ---
            String filteredByLevel = mockMvc.perform(get("/api/students?programLevelId=" + nextLevelId)
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(filteredByLevel.contains(studentId));

            // --- Archive + restore round trip. ---
            mockMvc.perform(post("/api/students/" + studentId + "/archive")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            String listWithoutArchived = mockMvc.perform(get("/api/students")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listWithoutArchived.contains(studentId));
            mockMvc.perform(post("/api/students/" + studentId + "/restore")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").doesNotExist());
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

    private String createInstitution(String superToken, String name) throws Exception {
        String response = mockMvc.perform(post("/api/institutions")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"%s","institutionType":"University",
                         "adminUser":"Test Admin","adminEmail":"admin@studenttestuniversity.edu.ng"}
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
                        {"firstName":"Student","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"StudentTest@2026",
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
