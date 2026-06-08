package ch.flaes.flipperauth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ch.flaes.flipperauth.domain.FlipperDeviceEntity;

public interface FlipperDeviceRepository extends JpaRepository<FlipperDeviceEntity, Long> {
    Optional<FlipperDeviceEntity> findByFlipperId(String flipperId);
}
