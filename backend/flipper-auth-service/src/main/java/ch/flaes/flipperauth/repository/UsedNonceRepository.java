package ch.flaes.flipperauth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ch.flaes.flipperauth.domain.UsedNonceEntity;

public interface UsedNonceRepository extends JpaRepository<UsedNonceEntity, Long> {
    Optional<UsedNonceEntity> findByNonce(String nonce);
}
