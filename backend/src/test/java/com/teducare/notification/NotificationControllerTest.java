package com.teducare.notification;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void realBackendActionsGenerateCorrectlyScopedNotifications() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");

        String createResponse = mockMvc.perform(post("/api/institutions")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Notification Test University","institutionType":"University",
                         "adminUser":"Test Admin","adminEmail":"admin@notificationtestuniversity.edu.ng"}
                        """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String institutionId = createResponse.split("\"id\":\"")[1].split("\"")[0];

        String userManagerId = null;
        try {
            String suffix = String.valueOf(System.currentTimeMillis());
            String username = "notif_admin_" + suffix;
            String email = "notif.admin." + suffix + "@example.com";
            String userManagerResponse = mockMvc.perform(post("/api/user-managers")
                    .header("Authorization", "Bearer " + superToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"firstName":"Notif","lastName":"Admin","email":"%s",
                             "username":"%s","password":"NotifP@ss1",
                             "institutionId":"%s","isPrimaryAdmin":true}
                            """.formatted(email, username, institutionId)))
                    .andExpect(status().isCreated())
                    .andReturn()
                    .getResponse()
                    .getContentAsString();
            userManagerId = userManagerResponse.split("\"id\":\"")[1].split("\"")[0];

            // super_admin's own feed gets the platform-scope notifications for both actions.
            String superFeed = mockMvc.perform(get("/api/notifications")
                    .param("perPage", "200")
                    .header("Authorization", "Bearer " + superToken))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString();
            assertTrue(superFeed.contains("New institution added"));
            assertTrue(superFeed.contains("Notification Test University"));
            assertTrue(superFeed.contains("New account added"));

            // The institution's own new admin sees the institution-scope notification about their own account.
            String instToken = loginAs(username, "NotifP@ss1");
            String instFeed = mockMvc.perform(get("/api/notifications")
                    .param("perPage", "200")
                    .header("Authorization", "Bearer " + instToken))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString();
            assertTrue(instFeed.contains("A new admin was assigned"));
            // Multi-tenancy: never the platform-scope feed meant only for super admins.
            assertFalse(instFeed.contains("New institution added"));

            // A completely unrelated institution admin must never see any of this.
            String outsiderToken = loginAs("amara_bello", "Amara@2024");
            String outsiderFeed = mockMvc.perform(get("/api/notifications")
                    .param("perPage", "200")
                    .header("Authorization", "Bearer " + outsiderToken))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString();
            assertFalse(outsiderFeed.contains("Notification Test University"));
            assertFalse(outsiderFeed.contains("A new admin was assigned"));
        } finally {
            // The institution's own archive doesn't cascade-archive its User
            // Manager accounts — leaving this out left a permanent, ever-growing
            // "notif_admin_<timestamp>" account behind on every test run (found
            // live: the user spotted a real accumulation of these in the User
            // Manager list and had them manually cleaned up).
            if (userManagerId != null) {
                mockMvc.perform(post("/api/user-managers/" + userManagerId + "/archive")
                        .header("Authorization", "Bearer " + superToken));
            }
            mockMvc.perform(post("/api/institutions/" + institutionId + "/archive")
                    .header("Authorization", "Bearer " + superToken));
        }
    }

    @Test
    void unreadCountMarkReadMarkAllReadAndDismissRoundTrip() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");

        String createResponse = mockMvc.perform(post("/api/institutions")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Notification Lifecycle University","institutionType":"University",
                         "adminUser":"Test Admin","adminEmail":"admin@notiflifecycleuniversity.edu.ng"}
                        """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String institutionId = createResponse.split("\"id\":\"")[1].split("\"")[0];

        try {
            String listResponse = mockMvc.perform(get("/api/notifications")
                    .param("perPage", "200")
                    .header("Authorization", "Bearer " + superToken))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString();

            int titleIdx = listResponse.indexOf("\"title\":\"New institution added\"");
            assertTrue(titleIdx >= 0, "Expected a 'New institution added' notification in the feed");
            String beforeTitle = listResponse.substring(0, titleIdx);
            int idKeyIdx = beforeTitle.lastIndexOf("\"id\":\"");
            String id = beforeTitle.substring(idKeyIdx + "\"id\":\"".length()).split("\"")[0];

            // Freshly created, so it's unread — the platform-wide unread count must
            // reflect at least this one.
            mockMvc.perform(get("/api/notifications/unread-count")
                    .header("Authorization", "Bearer " + superToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.count").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));

            mockMvc.perform(patch("/api/notifications/" + id + "/read")
                    .header("Authorization", "Bearer " + superToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.read").value(true));

            mockMvc.perform(post("/api/notifications/read-all")
                    .header("Authorization", "Bearer " + superToken))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/notifications/unread-count")
                    .header("Authorization", "Bearer " + superToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.count").value(0));

            // A real delete, not an archive — acting on it again 404s.
            mockMvc.perform(delete("/api/notifications/" + id)
                    .header("Authorization", "Bearer " + superToken))
                    .andExpect(status().isOk());
            mockMvc.perform(patch("/api/notifications/" + id + "/read")
                    .header("Authorization", "Bearer " + superToken))
                    .andExpect(status().isNotFound());
        } finally {
            mockMvc.perform(post("/api/institutions/" + institutionId + "/archive")
                    .header("Authorization", "Bearer " + superToken));
        }
    }

    @Test
    void cannotMarkOrDismissAnotherScopesNotification() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");

        // inst-xyz-college's own restore is a safe, idempotent trigger for a fresh
        // institution-scope notification (its archivedAt is already null either way).
        mockMvc.perform(post("/api/institutions/inst-xyz-college/restore")
                .header("Authorization", "Bearer " + superToken))
                .andExpect(status().isOk());

        String instToken = loginAs("turon_admin", "Turon@2024");
        String feed = mockMvc.perform(get("/api/notifications")
                .param("perPage", "200")
                .header("Authorization", "Bearer " + instToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        int titleIdx = feed.indexOf("\"title\":\"Institution restored\"");
        assertTrue(titleIdx >= 0, "Expected an 'Institution restored' notification in turon_admin's feed");
        String beforeTitle = feed.substring(0, titleIdx);
        int idKeyIdx = beforeTitle.lastIndexOf("\"id\":\"");
        String id = beforeTitle.substring(idKeyIdx + "\"id\":\"".length()).split("\"")[0];

        String outsiderToken = loginAs("amara_bello", "Amara@2024");
        mockMvc.perform(patch("/api/notifications/" + id + "/read")
                .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/notifications/" + id)
                .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isNotFound());
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
