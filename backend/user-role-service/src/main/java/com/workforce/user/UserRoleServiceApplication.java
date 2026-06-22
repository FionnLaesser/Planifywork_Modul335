package com.workforce.user;

import com.workforce.user.model.RoleName;
import com.workforce.user.model.User;
import com.workforce.user.repository.RoleRepository;
import com.workforce.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Slf4j
@SpringBootApplication
public class UserRoleServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(UserRoleServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner seedUsers(UserRepository users, RoleRepository roles, PasswordEncoder encoder, JdbcTemplate jdbc) {
        return args -> {
            seed(users, roles, encoder, "admin",      "admin@workforce.ch", "password", "System", "Admin",   RoleName.ADMIN);
            seed(users, roles, encoder, "hr.mueller", "hr@workforce.ch",    "password", "Anna",   "Mueller", RoleName.HR);
            seed(users, roles, encoder, "sl.huber",   "sl@workforce.ch",    "password", "Bruno",  "Huber",   RoleName.SHIFT_LEAD);
            seed(users, roles, encoder, "emp.meier",  "emp@workforce.ch",   "password", "Clara",  "Meier",   RoleName.EMPLOYEE);
            seedCurrentMonthBudget(users, jdbc);
        };
    }

    private void seedCurrentMonthBudget(UserRepository users, JdbcTemplate jdbc) {
        users.findByUsername("sl.huber").ifPresent(sl ->
            users.findByUsername("admin").ifPresent(admin -> {
                try {
                    LocalDate today = LocalDate.now();
                    Integer count = jdbc.queryForObject(
                        "SELECT COUNT(*) FROM hour_budgets WHERE shift_lead_id=? AND budget_year=? AND budget_month=?",
                        Integer.class, sl.getId(), today.getYear(), today.getMonthValue());
                    if (count == null || count == 0) {
                        jdbc.update(
                            "INSERT INTO hour_budgets (shift_lead_id, budget_year, budget_month, approved_hours, created_by) VALUES (?,?,?,?,?)",
                            sl.getId(), today.getYear(), today.getMonthValue(), new BigDecimal("160.00"), admin.getId());
                        log.info("Seed-HourBudget angelegt: sl.huber {}/{} (160h freigegeben)", today.getMonthValue(), today.getYear());
                    }
                } catch (Exception e) {
                    log.warn("Seed-HourBudget nicht angelegt: {}", e.getMessage());
                }
            })
        );
    }

    private void seed(UserRepository users, RoleRepository roles, PasswordEncoder encoder,
                      String username, String email, String rawPassword,
                      String firstName, String lastName, RoleName roleName) {
        if (users.existsByUsername(username)) return;
        roles.findByName(roleName.name()).ifPresent(role -> {
            User u = new User();
            u.setUsername(username);
            u.setEmail(email);
            u.setPassword(encoder.encode(rawPassword));
            u.setFirstName(firstName);
            u.setLastName(lastName);
            u.setRole(role);
            users.save(u);
            log.info("Seed-User angelegt: {} ({})", username, roleName);
        });
    }
}
