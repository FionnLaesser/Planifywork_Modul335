package ch.flaes.flipperauth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ch.flaes.flipperauth.domain.UserEntity;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByUsername(String username);
}
