package com.teducare.course;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
class CourseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullCourseLifecycleIncludingIndependentFksSearchAndDuplicateRejection() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionAId = createInstitution(superToken, "Course Test University " + suffix);
        String institutionBId = createInstitution(superToken, "Course Test University B " + suffix);
        String usernameA = "course_admin_" + suffix;
        String usernameB = "course_admin_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "course_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "course_b_" + suffix);
            String tokenA = loginAs(usernameA, "CourseTest@2026");
            String tokenB = loginAs(usernameB, "CourseTest@2026");

            String schoolAId = createSchool(tokenA, "School of Course Test A");
            String otherSchoolAId = createSchool(tokenA, "Other School Course Test A");
            String facultyAId = createFaculty(tokenA, "Faculty of Course Test A", schoolAId);
            String departmentAId = createDepartment(tokenA, "Dept of Course Test A", facultyAId, schoolAId);
            String levelAId = createProgramLevel(tokenA, "100L-" + suffix);
            String schoolBId = createSchool(tokenB, "School of Course Test B");
            String facultyBId = createFaculty(tokenB, "Faculty of Course Test B", schoolBId);
            String departmentBId = createDepartment(tokenB, "Dept of Course Test B", facultyBId, schoolBId);

            // departmentId from a different institution is rejected.
            mockMvc.perform(post("/api/courses")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Hijack Course\",\"code\":\"HJ101\",\"departmentId\":\"" + departmentBId
                            + "\",\"schoolId\":\"" + schoolAId + "\",\"programLevelId\":\"" + levelAId
                            + "\",\"unit\":3}"))
                    .andExpect(status().isNotFound());

            // schoolId from a different institution is rejected (departmentId valid).
            mockMvc.perform(post("/api/courses")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Hijack Course 2\",\"code\":\"HJ102\",\"departmentId\":\"" + departmentAId
                            + "\",\"schoolId\":\"" + schoolBId + "\",\"programLevelId\":\"" + levelAId
                            + "\",\"unit\":3}"))
                    .andExpect(status().isNotFound());

            // Independent FK proof: schoolId differs from department's own school.
            String createResponse = mockMvc.perform(post("/api/courses")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Pure Mathematics\",\"code\":\"MAT101\",\"departmentId\":\"" + departmentAId
                            + "\",\"schoolId\":\"" + otherSchoolAId + "\",\"programLevelId\":\"" + levelAId
                            + "\",\"unit\":3}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.code").value("MAT101"))
                    .andExpect(jsonPath("$.schoolId").value(otherSchoolAId))
                    .andExpect(jsonPath("$.programLevelId").value(levelAId))
                    .andExpect(jsonPath("$.unit").value(3))
                    .andReturn().getResponse().getContentAsString();
            String courseId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // Duplicate code (case-insensitive) rejected.
            mockMvc.perform(post("/api/courses")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Another Name\",\"code\":\"mat101\",\"departmentId\":\"" + departmentAId
                            + "\",\"schoolId\":\"" + schoolAId + "\",\"programLevelId\":\"" + levelAId
                            + "\",\"unit\":3}"))
                    .andExpect(status().isConflict());

            // Invalid unit (out of 1-10 range) rejected.
            mockMvc.perform(post("/api/courses")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Bad Unit Course\",\"code\":\"BU101\",\"departmentId\":\"" + departmentAId
                            + "\",\"schoolId\":\"" + schoolAId + "\",\"programLevelId\":\"" + levelAId
                            + "\",\"unit\":0}"))
                    .andExpect(status().isBadRequest());

            // Search by name and by code.
            String searchByName = mockMvc.perform(get("/api/courses?search=pure")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(searchByName.contains(courseId));
            String searchByCode = mockMvc.perform(get("/api/courses?search=MAT101")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(searchByCode.contains(courseId));
            String searchNoMatch = mockMvc.perform(get("/api/courses?search=nonexistent")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(searchNoMatch.contains(courseId));

            // Filter by departmentId (include) and schoolId=schoolAId (exclude, since course's own school is otherSchoolAId).
            String filteredByDept = mockMvc.perform(get("/api/courses?departmentId=" + departmentAId)
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(filteredByDept.contains(courseId));
            String filteredByWrongSchool = mockMvc.perform(get("/api/courses?schoolId=" + schoolAId)
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(filteredByWrongSchool.contains(courseId));

            // Edit.
            mockMvc.perform(patch("/api/courses/" + courseId)
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Advanced Pure Mathematics\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Advanced Pure Mathematics"))
                    .andExpect(jsonPath("$.code").value("MAT101"));

            // Reassigning schoolId to institution B's school is rejected.
            mockMvc.perform(patch("/api/courses/" + courseId)
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"schoolId\":\"" + schoolBId + "\"}"))
                    .andExpect(status().isNotFound());

            // Institution B must not see institution A's course.
            String listForB = mockMvc.perform(get("/api/courses")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listForB.contains(courseId));

            // CSV import: one valid row, one missing-column row, one duplicate-code row, one bad-FK row.
            String csv = "name,code,departmentId,schoolId,programLevelId,unit\n"
                    + "General Studies,GST101," + departmentAId + "," + schoolAId + "," + levelAId + ",2\n"
                    + ",NOCODE," + departmentAId + "," + schoolAId + "," + levelAId + ",2\n"
                    + "Duplicate,MAT101," + departmentAId + "," + schoolAId + "," + levelAId + ",2\n"
                    + "Bad FK,BADFK101,does-not-exist," + schoolAId + "," + levelAId + ",2\n";
            MockMultipartFile csvFile = new MockMultipartFile(
                    "file", "courses.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));
            mockMvc.perform(multipart("/api/courses/import")
                    .file(csvFile)
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.imported").value(1))
                    .andExpect(jsonPath("$.skipped").value(3));

            String listAfterImport = mockMvc.perform(get("/api/courses")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(listAfterImport.contains("GST101"));

            // CSV export.
            String csvExport = mockMvc.perform(get("/api/courses/export")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(result -> assertTrue(
                            result.getResponse().getContentType().startsWith("text/csv")))
                    .andReturn().getResponse().getContentAsString();
            assertTrue(csvExport.contains("GST101"));
            assertTrue(csvExport.contains("MAT101"));

            // lecturerId: nullable FK to a StaffMember, optional at create, clearable via a blank string on update.
            String lecturerDesigId = createDesignation(tokenA, "Lecturer-" + suffix, "Academic Staff");
            String lecturerId = createStaffMember(tokenA, "LEC-" + suffix, lecturerDesigId, departmentAId);

            mockMvc.perform(post("/api/courses")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Taught Course\",\"code\":\"TC101\",\"departmentId\":\"" + departmentAId
                            + "\",\"schoolId\":\"" + schoolAId + "\",\"programLevelId\":\"" + levelAId
                            + "\",\"unit\":3,\"lecturerId\":\"does-not-exist\"}"))
                    .andExpect(status().isNotFound());

            String taughtCourseResponse = mockMvc.perform(post("/api/courses")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Taught Course\",\"code\":\"TC101\",\"departmentId\":\"" + departmentAId
                            + "\",\"schoolId\":\"" + schoolAId + "\",\"programLevelId\":\"" + levelAId
                            + "\",\"unit\":3,\"lecturerId\":\"" + lecturerId + "\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.lecturerId").value(lecturerId))
                    .andReturn().getResponse().getContentAsString();
            String taughtCourseId = taughtCourseResponse.split("\"id\":\"")[1].split("\"")[0];

            // Clearing via an explicit blank string un-assigns the lecturer.
            mockMvc.perform(patch("/api/courses/" + taughtCourseId)
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"lecturerId\":\"\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.lecturerId").doesNotExist());

            // Archive + restore round trip.
            mockMvc.perform(post("/api/courses/" + courseId + "/archive")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            String listWithoutArchived = mockMvc.perform(get("/api/courses")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listWithoutArchived.contains(courseId));
            mockMvc.perform(post("/api/courses/" + courseId + "/restore")
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

    private String createStaffMember(String token, String staffId, String designationId, String departmentId)
            throws Exception {
        String response = mockMvc.perform(post("/api/staff-members")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"staffId":"%s","roleId":"%s","designationId":"%s","departmentId":"%s",
                         "gender":"Male","firstName":"Course","lastName":"Lecturer","maritalStatus":"Single",
                         "email":"lecturer.%s@staff.test","phone":"08033334444",
                         "emergencyContact":"08033334445","dateOfBirth":"1980-01-01T00:00:00Z",
                         "employmentStartDate":"2015-01-01T00:00:00Z","contactAddress":"1 Lecturer Lane"}
                        """.formatted(staffId, designationId, designationId, departmentId, staffId))
                )
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
                         "adminUser":"Test Admin","adminEmail":"admin@coursetestuniversity.edu.ng"}
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
                        {"firstName":"Course","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"CourseTest@2026",
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
