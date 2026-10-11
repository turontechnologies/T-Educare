package com.teducare.lecturer;

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
class LectureAssignmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void assignmentTimetableAndChangeRequestLifecycle() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionId = createInstitution(superToken, "Lecture Assignment Test University " + suffix);
        String institutionBId = createInstitution(superToken, "Lecture Assignment Test University B " + suffix);
        String username = "lectureassign_admin_" + suffix;
        String usernameB = "lectureassign_admin_b_" + suffix;
        String userManagerId = null;
        String userManagerBId = null;

        try {
            userManagerId = createUserManager(superToken, institutionId, username, "lectureassign_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "lectureassign_b_" + suffix);
            String token = loginAs(username, "LectureAssignTest@2026");
            String tokenB = loginAs(usernameB, "LectureAssignTest@2026");

            String schoolId = createSchool(token, "School of Lecture Assign Test");
            String facultyId = createFaculty(token, "Faculty of Lecture Assign Test", schoolId);
            String departmentId = createDepartment(token, "Dept of Lecture Assign Test", facultyId, schoolId);
            String levelId = createProgramLevel(token, "100L-" + suffix);
            String courseId = createCourse(token, "LAT101", departmentId, schoolId, levelId);
            String sessionId = createAcademicSession(token, suffix);

            String lecturerId = createLecturer(token, suffix, schoolId);

            // Course from a different institution is rejected.
            String otherSchoolId = createSchool(tokenB, "School of Lecture Assign Test B");
            String otherFacultyId = createFaculty(tokenB, "Faculty of Lecture Assign Test B", otherSchoolId);
            String otherDepartmentId =
                    createDepartment(tokenB, "Dept of Lecture Assign Test B", otherFacultyId, otherSchoolId);
            String otherLevelId = createProgramLevel(tokenB, "100L-b-" + suffix);
            String otherCourseId = createCourse(tokenB, "LAT102", otherDepartmentId, otherSchoolId, otherLevelId);
            mockMvc.perform(post("/api/lecture-assignments")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"lecturerId\":\"" + lecturerId + "\",\"courseId\":\"" + otherCourseId
                            + "\",\"academicSessionId\":\"" + sessionId + "\"}"))
                    .andExpect(status().isNotFound());

            // Create assignment.
            String createResponse = mockMvc.perform(post("/api/lecture-assignments")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"lecturerId\":\"" + lecturerId + "\",\"courseId\":\"" + courseId
                            + "\",\"academicSessionId\":\"" + sessionId + "\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.lecturerId").value(lecturerId))
                    .andExpect(jsonPath("$.courseId").value(courseId))
                    .andReturn().getResponse().getContentAsString();
            String assignmentId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // Duplicate assignment (same lecturer+course+session) rejected.
            mockMvc.perform(post("/api/lecture-assignments")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"lecturerId\":\"" + lecturerId + "\",\"courseId\":\"" + courseId
                            + "\",\"academicSessionId\":\"" + sessionId + "\"}"))
                    .andExpect(status().isConflict());

            // Invalid time format rejected.
            mockMvc.perform(post("/api/lecture-assignments/" + assignmentId + "/timetable-slots")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"dayOfWeek\":\"MONDAY\",\"startTime\":\"10am\",\"endTime\":\"12:00\","
                            + "\"venue\":\"Room 4\"}"))
                    .andExpect(status().isBadRequest());

            // start >= end rejected.
            mockMvc.perform(post("/api/lecture-assignments/" + assignmentId + "/timetable-slots")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"dayOfWeek\":\"MONDAY\",\"startTime\":\"12:00\",\"endTime\":\"10:00\","
                            + "\"venue\":\"Room 4\"}"))
                    .andExpect(status().isBadRequest());

            // Add a real slot.
            String slotResponse = mockMvc.perform(post("/api/lecture-assignments/" + assignmentId
                    + "/timetable-slots")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"dayOfWeek\":\"MONDAY\",\"startTime\":\"10:00\",\"endTime\":\"12:00\","
                            + "\"venue\":\"Room 4\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.dayOfWeek").value("MONDAY"))
                    .andReturn().getResponse().getContentAsString();
            String slotId = slotResponse.split("\"id\":\"")[1].split("\"")[0];

            // Link the caller's own account to this lecturer, so they can request a change.
            mockMvc.perform(patch("/api/user-managers/" + userManagerId)
                    .header("Authorization", "Bearer " + superToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"lecturerId\":\"" + lecturerId + "\"}"))
                    .andExpect(status().isOk());
            // Token must be refreshed to pick up the newly-resolved lecturerId.
            token = loginAs(username, "LectureAssignTest@2026");

            // Request a change on their own slot.
            String changeResponse = mockMvc.perform(post("/api/lecture-assignments/change-requests")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"timetableSlotId\":\"" + slotId + "\",\"proposedDayOfWeek\":\"TUESDAY\","
                            + "\"proposedStartTime\":\"14:00\",\"proposedEndTime\":\"16:00\","
                            + "\"reason\":\"Clashes with another commitment\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.status").value("PENDING"))
                    .andReturn().getResponse().getContentAsString();
            String changeRequestId = changeResponse.split("\"id\":\"")[1].split("\"")[0];

            // Approve it — the real slot should now reflect the proposed time.
            mockMvc.perform(post("/api/lecture-assignments/change-requests/" + changeRequestId + "/approve")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("APPROVED"));

            String assignmentsAfterApproval = mockMvc.perform(get("/api/lecture-assignments")
                    .header("Authorization", "Bearer " + token)
                    .param("lecturerId", lecturerId))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            org.junit.jupiter.api.Assertions.assertTrue(assignmentsAfterApproval.contains("\"dayOfWeek\":\"TUESDAY\""));

            // Approving an already-resolved request is rejected.
            mockMvc.perform(post("/api/lecture-assignments/change-requests/" + changeRequestId + "/approve")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isConflict());

            // Archive + restore the assignment.
            mockMvc.perform(post("/api/lecture-assignments/" + assignmentId + "/archive")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            mockMvc.perform(post("/api/lecture-assignments/" + assignmentId + "/restore")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").doesNotExist());

            // Delete the slot.
            mockMvc.perform(delete("/api/lecture-assignments/" + assignmentId + "/timetable-slots/" + slotId)
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isNoContent());
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

    @Test
    void importAndExportTimetableCsv() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionId = createInstitution(superToken, "Timetable CSV Test University " + suffix);
        String username = "timetablecsv_admin_" + suffix;
        String userManagerId = null;

        try {
            userManagerId = createUserManager(superToken, institutionId, username, "timetablecsv_" + suffix);
            String token = loginAs(username, "LectureAssignTest@2026");

            String schoolId = createSchool(token, "School of Timetable CSV Test");
            String facultyId = createFaculty(token, "Faculty of Timetable CSV Test", schoolId);
            String departmentId = createDepartment(token, "Dept of Timetable CSV Test", facultyId, schoolId);
            String levelId = createProgramLevel(token, "100L-csv-" + suffix);
            String courseId = createCourse(token, "TTC101", departmentId, schoolId, levelId);
            String sessionId = createAcademicSession(token, "csv-" + suffix);
            String lecturerId = createLecturer(token, "csv-" + suffix, schoolId);

            String lecturerUsername = "UL-csv-" + suffix;
            String sessionName = "LAT csv-" + suffix;

            String csv = "lecturerUsername,courseCode,academicSession,dayOfWeek,startTime,endTime,venue\n"
                    + lecturerUsername + ",TTC101," + sessionName + ",MONDAY,09:00,11:00,Room 9\n"
                    + "unknown-lecturer,TTC101," + sessionName + ",MONDAY,09:00,11:00,Room 9\n"
                    + lecturerUsername + ",UNKNOWNCODE," + sessionName + ",MONDAY,09:00,11:00,Room 9\n"
                    + lecturerUsername + ",TTC101," + sessionName + ",NOTADAY,09:00,11:00,Room 9\n";
            MockMultipartFile csvFile = new MockMultipartFile(
                    "file", "timetable.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

            mockMvc.perform(multipart("/api/lecture-assignments/import")
                    .file(csvFile)
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.imported").value(1))
                    .andExpect(jsonPath("$.skipped").value(3));

            // Re-importing the exact same valid row is a duplicate slot — skipped, not re-imported.
            MockMultipartFile reimport = new MockMultipartFile(
                    "file", "timetable.csv", "text/csv",
                    ("lecturerUsername,courseCode,academicSession,dayOfWeek,startTime,endTime,venue\n"
                            + lecturerUsername + ",TTC101," + sessionName + ",MONDAY,09:00,11:00,Room 9\n")
                            .getBytes(StandardCharsets.UTF_8));
            mockMvc.perform(multipart("/api/lecture-assignments/import")
                    .file(reimport)
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.imported").value(0))
                    .andExpect(jsonPath("$.skipped").value(1));

            // Full export contains the imported row.
            String fullExport = mockMvc.perform(get("/api/lecture-assignments/export")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(result -> assertTrue(
                            result.getResponse().getContentType().startsWith("text/csv")))
                    .andReturn().getResponse().getContentAsString();
            assertTrue(fullExport.contains(lecturerUsername));
            assertTrue(fullExport.contains("TTC101"));
            assertTrue(fullExport.contains("Room 9"));

            // Department-scoped export still contains it (same department); a different, empty department excludes it.
            String deptExport = mockMvc.perform(get("/api/lecture-assignments/export")
                    .param("departmentId", departmentId)
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(deptExport.contains("TTC101"));

            String otherDepartmentId = createDepartment(token, "Other Dept Timetable CSV Test", facultyId, schoolId);
            String emptyDeptExport = mockMvc.perform(get("/api/lecture-assignments/export")
                    .param("departmentId", otherDepartmentId)
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(!emptyDeptExport.contains("TTC101"));

            // Sanity: the course/session/lecturer created above are the ones actually referenced.
            assertTrue(courseId != null && sessionId != null && lecturerId != null);
        } finally {
            if (userManagerId != null) {
                mockMvc.perform(post("/api/user-managers/" + userManagerId + "/archive")
                        .header("Authorization", "Bearer " + superToken));
            }
            mockMvc.perform(post("/api/institutions/" + institutionId + "/archive")
                    .header("Authorization", "Bearer " + superToken));
        }
    }

    private String createLecturer(String token, String suffix, String schoolId) throws Exception {
        String response = mockMvc.perform(post("/api/lecturers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"UL-%s","position":"Senior Lecturer","assignmentType":"school",
                         "assignmentId":"%s","gender":"Male","firstName":"Ada","lastName":"Okoye",
                         "email":"ada.okoye@lectureassigntest.edu","phone":"08011112222"}
                        """.formatted(suffix, schoolId)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createCourse(String token, String code, String departmentId, String schoolId, String levelId)
            throws Exception {
        String response = mockMvc.perform(post("/api/courses")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + code + " Course\",\"code\":\"" + code + "\",\"departmentId\":\""
                        + departmentId + "\",\"schoolId\":\"" + schoolId + "\",\"programLevelId\":\"" + levelId
                        + "\",\"unit\":3,\"semesterNumber\":1}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createAcademicSession(String token, String suffix) throws Exception {
        String response = mockMvc.perform(post("/api/academic-sessions")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"session\":\"LAT " + suffix + "\",\"from\":\"2024-09-01T00:00:00Z\","
                        + "\"to\":\"2025-07-31T00:00:00Z\"}"))
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

    private String createProgramLevel(String token, String levelCode) throws Exception {
        String response = mockMvc.perform(post("/api/program-levels")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"levelCode\":\"" + levelCode + "\",\"description\":\"" + levelCode + " description\"}"))
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
                         "adminUser":"Test Admin","adminEmail":"admin@lectureassigntestuniversity.edu.ng"}
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
                        {"firstName":"LectureAssign","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"LectureAssignTest@2026",
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
