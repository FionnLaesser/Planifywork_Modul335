package com.workforce.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workforce.auth.model.Role;
import com.workforce.auth.model.User;
import com.workforce.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestRoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        roleRepository.deleteAll();

        Role role = new Role();
        role.setName("EMPLOYEE");
        role = roleRepository.save(role);

        User user = new User();
        user.setUsername("testuser");
        user.setEmail("testuser@example.com");
        user.setPassword(passwordEncoder.encode("password123"));
        user.setRole(role);
        user.setActive(true);
        userRepository.save(user);
    }

    @Test
    void loginWithValidCredentialsReturnsToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "testuser",
                                "password", "password123"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("EMPLOYEE"))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.userId").isNumber())
                .andReturn();

        String token = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token").asText();
        assertThat(token).isNotBlank();
    }

    @Test
    void loginWithWrongPasswordReturns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "testuser",
                                "password", "wrongpassword"
                        ))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginWithUnknownUserReturns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "ghost",
                                "password", "doesntmatter"
                        ))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validateWithValidTokenReturnsUsernameAndRole() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "testuser",
                                "password", "password123"
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asText();

        mockMvc.perform(get("/api/auth/validate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.role").value("EMPLOYEE"));
    }

    @Test
    void validateWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/validate"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginWithInactiveUserReturns401() throws Exception {
        userRepository.deleteAll();
        Role role = roleRepository.findAll().get(0);

        User inactive = new User();
        inactive.setUsername("inactiveuser");
        inactive.setEmail("inactive@example.com");
        inactive.setPassword(passwordEncoder.encode("password123"));
        inactive.setRole(role);
        inactive.setActive(false);
        userRepository.save(inactive);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "inactiveuser",
                                "password", "password123"
                        ))))
                .andExpect(status().isUnauthorized());
    }
}
