package ch.flaes.flipperauth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ch.flaes.flipperauth.domain.TimeEntryEntity;

public interface TimeEntryRepository extends JpaRepository<TimeEntryEntity, Long> {
    Optional<TimeEntryEntity> findFirstByEmployeeIdAndCheckOutIsNullOrderByCheckInDesc(Long employeeId);
}
