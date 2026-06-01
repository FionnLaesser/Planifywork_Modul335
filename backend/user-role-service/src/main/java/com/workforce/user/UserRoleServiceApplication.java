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
import org.springframework.security.crypto.password.PasswordEncoder;

@Slf4j
@SpringBootApplication
public class UserRoleServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(UserRoleServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner seedUsers(UserRepository users, RoleRepository roles, PasswordEncoder encoder) {
        return args -> {
            seed(users, roles, encoder, "admin",      "admin@workforce.ch", "password", "System", "Admin",   RoleName.ADMIN);
            seed(users, roles, encoder, "hr.mueller", "hr@workforce.ch",    "password", "Anna",   "Mueller", RoleName.HR);
            seed(users, roles, encoder, "sl.huber",   "sl@workforce.ch",    "password", "Bruno",  "Huber",   RoleName.SHIFT_LEAD);
            seed(users, roles, encoder, "emp.meier",  "emp@workforce.ch",   "password", "Clara",  "Meier",   RoleName.EMPLOYEE);
        };
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
