package ch.flaes.flipperauth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import ch.flaes.flipperauth.repository.TimeEntryRepository;
import ch.flaes.flipperauth.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TimeEntryRepository timeEntryRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void clearTimeEntries() {
        timeEntryRepository.deleteAll();
    }

    @Test
    void loginAndLogoutCanBeSimulated() throws Exception {
        Long fionnId = userRepository.findByUsername("fionn").orElseThrow().getId();

        Long loginSessionId = startSession("LOGIN");
        simulateDevice(loginSessionId, "Check-in tracked");
        assertStatus(loginSessionId, "LOGIN", true);
        assertThat(timeEntryRepository.findFirstByEmployeeIdAndCheckOutIsNullOrderByCheckInDesc(fionnId))
                .isPresent();

        Long logoutSessionId = startSession("LOGOUT");
        simulateDevice(logoutSessionId, "Check-out tracked");
        assertStatus(logoutSessionId, "LOGOUT", false);
        assertThat(timeEntryRepository.findFirstByEmployeeIdAndCheckOutIsNullOrderByCheckInDesc(fionnId))
                .isEmpty();
    }

    @Test
    void latestPendingReturnsNewestOpenSessionAnd404AfterUse() throws Exception {
        Long firstSessionId = startSession("LOGIN");
        Long secondSessionId = startSession("LOGOUT");

        mockMvc.perform(get("/api/flipper-auth/latest-pending")
                        .param("username", "fionn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(secondSessionId))
                .andExpect(jsonPath("$.username").value("fionn"))
                .andExpect(jsonPath("$.action").value("LOGOUT"))
                .andExpect(jsonPath("$.challenge").isNotEmpty())
                .andExpect(jsonPath("$.expiresAt").exists());

        simulateDevice(secondSessionId, "No open check-in found");
        simulateDevice(firstSessionId, "Check-in tracked");

        mockMvc.perform(get("/api/flipper-auth/latest-pending")
                        .param("username", "fionn"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No pending auth session found"));
    }

    private Long startSession(String action) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/flipper-auth/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "fionn",
                                "action", action
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.challenge").isNotEmpty())
                .andExpect(jsonPath("$.action").value(action))
                .andExpect(jsonPath("$.expiresAt").exists())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("sessionId")
                .asLong();
    }

    private void simulateDevice(Long sessionId, String expectedMessage) throws Exception {
        mockMvc.perform(post("/api/flipper-auth/simulate-device")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("sessionId", sessionId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value(expectedMessage));
    }

    private void assertStatus(Long sessionId, String action, boolean loggedIn) throws Exception {
        mockMvc.perform(get("/api/flipper-auth/status/{sessionId}", sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(sessionId))
                .andExpect(jsonPath("$.username").value("fionn"))
                .andExpect(jsonPath("$.action").value(action))
                .andExpect(jsonPath("$.used").value(true))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.loggedIn").value(loggedIn));
    }
}
