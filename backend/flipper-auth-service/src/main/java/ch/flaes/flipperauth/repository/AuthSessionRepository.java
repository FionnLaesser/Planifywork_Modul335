package ch.flaes.flipperauth.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ch.flaes.flipperauth.domain.AuthSessionEntity;

public interface AuthSessionRepository extends JpaRepository<AuthSessionEntity, Long> {
    List<AuthSessionEntity> findAllByOrderByCreatedAtDesc();

    Optional<AuthSessionEntity> findFirstByUserUsernameAndUsedFalseAndSuccessFalseAndExpiresAtAfterOrderByCreatedAtDescIdDesc(
            String username,
            Instant now
    );
}
