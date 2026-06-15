package ch.flaes.flipperauth.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import ch.flaes.flipperauth.domain.FlipperDeviceEntity;
import ch.flaes.flipperauth.repository.FlipperDeviceRepository;
import ch.flaes.flipperauth.repository.UserRepository;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(
            UserRepository userRepository,
            FlipperDeviceRepository flipperDeviceRepository,
            @Value("${flipper-auth.seed-default-users:true}") boolean seedDefaultUsers) {
        return args -> {
            if (!seedDefaultUsers) return;

            // Only link existing system users to Flipper devices — never insert new rows
            // into the shared users table (it has NOT NULL constraints managed by user-role-service)
            userRepository.findByUsername("emp.meier").ifPresent(empMeier ->
                    flipperDeviceRepository.findByFlipperId("emp-meier-flipper-001")
                            .orElseGet(() -> flipperDeviceRepository.save(
                                    new FlipperDeviceEntity("emp-meier-flipper-001", empMeier, "dev-secret-change-me")
                            ))
            );
        };
    }
}
