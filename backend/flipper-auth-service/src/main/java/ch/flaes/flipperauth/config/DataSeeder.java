package ch.flaes.flipperauth.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import ch.flaes.flipperauth.domain.FlipperDeviceEntity;
import ch.flaes.flipperauth.domain.UserEntity;
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
            if (seedDefaultUsers) {
                for (String username : List.of("fionn", "emp.meier")) {
                    userRepository.findByUsername(username)
                            .orElseGet(() -> userRepository.save(new UserEntity(username, false)));
                }
            }

            userRepository.findByUsername("fionn").ifPresent(user ->
                    flipperDeviceRepository.findByFlipperId("fionn-flipper-001")
                            .orElseGet(() -> flipperDeviceRepository.save(
                                    new FlipperDeviceEntity("fionn-flipper-001", user, "dev-secret-change-me")
                            ))
            );
        };
    }
}
