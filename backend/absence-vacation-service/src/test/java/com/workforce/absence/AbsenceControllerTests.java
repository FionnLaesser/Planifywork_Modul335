package com.workforce.absence;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workforce.absence.repository.AbsenceRepository;
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
class AbsenceControllerTests {

    private static final String JWT_SECRET =
            "workforce-super-secret-jwt-key-change-in-production-min-256-bits";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AbsenceRepository absenceRepository;

    @BeforeEach
    void setUp() {
        absenceRepository.deleteAll();
    }

    @Test
    void createAbsenceAsEmployeeReturns201() throws Exception {
        mockMvc.perform(post("/api/absences")
                        .header("Authorization", "Bearer " + token("emp.meier", "EMPLOYEE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "employeeId", 1,
                                "type", "VACATION",
                                "startDate", "2026-07-01",
                                "endDate", "2026-07-05"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.type").value("VACATION"));
    }

    @Test
    void getAbsencesByEmployeeReturns200() throws Exception {
        mockMvc.perform(post("/api/absences")
                        .header("Authorization", "Bearer " + token("emp.meier", "EMPLOYEE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "employeeId", 42,
                                "type", "SICK",
                                "startDate", "2026-07-01",
                                "endDate", "2026-07-02"
                        ))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/absences/employee/42")
                        .header("Authorization", "Bearer " + token("emp.meier", "EMPLOYEE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].type").value("SICK"));
    }

    @Test
    void pendingAbsencesRequiresHrRole() throws Exception {
        mockMvc.perform(get("/api/absences/pending")
                        .header("Authorization", "Bearer " + token("emp.meier", "EMPLOYEE")))
                .andExpect(status().isForbidden());
    }

    @Test
    void hrCanViewPendingAbsences() throws Exception {
        mockMvc.perform(post("/api/absences")
                        .header("Authorization", "Bearer " + token("hr.user", "HR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "employeeId", 5,
                                "type", "VACATION",
                                "startDate", "2026-08-01",
                                "endDate", "2026-08-05"
                        ))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/absences/pending")
                        .header("Authorization", "Bearer " + token("hr.user", "HR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void hrCanApprovePendingAbsence() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/absences")
                        .header("Authorization", "Bearer " + token("hr.user", "HR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "employeeId", 10,
                                "type", "VACATION",
                                "startDate", "2026-08-01",
                                "endDate", "2026-08-10"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        long id = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(put("/api/absences/{id}/approve", id)
                        .header("Authorization", "Bearer " + token("hr.user", "HR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    void hrCanRejectPendingAbsenceWithReason() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/absences")
                        .header("Authorization", "Bearer " + token("hr.user", "HR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "employeeId", 11,
                                "type", "OTHER",
                                "startDate", "2026-09-01",
                                "endDate", "2026-09-01"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        long id = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(put("/api/absences/{id}/reject", id)
                        .header("Authorization", "Bearer " + token("hr.user", "HR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "reviewerId", 99,
                                "rejectionReason", "Budget exceeded"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    void requestWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/absences/pending"))
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
