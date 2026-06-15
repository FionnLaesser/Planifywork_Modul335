package com.workforce.planning;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workforce.planning.repository.ShiftRepository;
import com.workforce.planning.repository.WorkPlanRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@SpringBootTest
@AutoConfigureMockMvc
class PlanningControllerTests {

    private static final String JWT_SECRET =
            "workforce-super-secret-jwt-key-change-in-production-min-256-bits";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WorkPlanRepository workPlanRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @BeforeEach
    void setUp() {
        shiftRepository.deleteAll();
        workPlanRepository.deleteAll();
    }

    @Test
    void createWorkPlanAsShiftLeadReturns201() throws Exception {
        mockMvc.perform(post("/api/planning/workplans")
                        .header("Authorization", "Bearer " + token("sl.meier", "SHIFT_LEAD"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Monatsplan Juli 2026",
                                "shiftLeadId", 5,
                                "startDate", "2026-07-01",
                                "endDate", "2026-07-31",
                                "approvedHours", 160
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Monatsplan Juli 2026"))
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void getWorkPlansReturnsAllPlans() throws Exception {
        mockMvc.perform(post("/api/planning/workplans")
                        .header("Authorization", "Bearer " + token("sl.meier", "SHIFT_LEAD"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Plan A",
                                "shiftLeadId", 5,
                                "startDate", "2026-07-01",
                                "endDate", "2026-07-31",
                                "approvedHours", 80
                        ))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/planning/workplans")
                        .header("Authorization", "Bearer " + token("sl.meier", "SHIFT_LEAD")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void addShiftToWorkPlanReturnsUpdatedPlan() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/planning/workplans")
                        .header("Authorization", "Bearer " + token("sl.meier", "SHIFT_LEAD"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Plan mit Schicht",
                                "shiftLeadId", 7,
                                "startDate", "2026-07-01",
                                "endDate", "2026-07-31",
                                "approvedHours", 40
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        long planId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(post("/api/planning/workplans/{id}/shifts", planId)
                        .header("Authorization", "Bearer " + token("sl.meier", "SHIFT_LEAD"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "employeeId", 3,
                                "shiftDate", "2026-07-15",
                                "startTime", "08:00:00",
                                "endTime", "16:00:00"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shifts.length()").value(1))
                .andExpect(jsonPath("$.shifts[0].employeeId").value(3));
    }

    @Test
    void publishWorkPlanChangesStatusToPublished() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/planning/workplans")
                        .header("Authorization", "Bearer " + token("sl.meier", "SHIFT_LEAD"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Plan zum Veroeffentlichen",
                                "shiftLeadId", 7,
                                "startDate", "2026-07-01",
                                "endDate", "2026-07-31",
                                "approvedHours", 40
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        long planId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asLong();

        // Plan braucht mindestens eine Schicht vor der Veröffentlichung
        mockMvc.perform(post("/api/planning/workplans/{id}/shifts", planId)
                        .header("Authorization", "Bearer " + token("sl.meier", "SHIFT_LEAD"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "employeeId", 3,
                                "shiftDate", "2026-07-10",
                                "startTime", "08:00:00",
                                "endTime", "16:00:00"
                        ))))
                .andExpect(status().isCreated());

        mockMvc.perform(put("/api/planning/workplans/{id}/publish", planId)
                        .header("Authorization", "Bearer " + token("sl.meier", "SHIFT_LEAD")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    @Test
    void employeeCanViewPublishedCalendarShifts() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/planning/workplans")
                        .header("Authorization", "Bearer " + token("sl.meier", "SHIFT_LEAD"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Kalendertest",
                                "shiftLeadId", 7,
                                "startDate", "2026-07-01",
                                "endDate", "2026-07-31",
                                "approvedHours", 40
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        long planId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(post("/api/planning/workplans/{id}/shifts", planId)
                        .header("Authorization", "Bearer " + token("sl.meier", "SHIFT_LEAD"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "employeeId", 3,
                                "shiftDate", "2026-07-20",
                                "startTime", "08:00:00",
                                "endTime", "16:00:00"
                        ))))
                .andExpect(status().isCreated());

        mockMvc.perform(put("/api/planning/workplans/{id}/publish", planId)
                        .header("Authorization", "Bearer " + token("sl.meier", "SHIFT_LEAD")))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/planning/calendar/3")
                        .param("from", "2026-07-01")
                        .param("to", "2026-07-31")
                        .header("Authorization", "Bearer " + token("emp.meier", "EMPLOYEE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].employeeId").value(3));
    }

    @Test
    void requestWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/planning/workplans"))
                .andExpect(status().isUnauthorized());
    }

    private String token(String username, String role) {
        SecretKey key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 86_400_000L))
                .signWith(key)
                .compact();
    }
}
