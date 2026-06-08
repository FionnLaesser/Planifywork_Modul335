package ch.flaes.flipperauth.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ch.flaes.flipperauth.domain.AuthAction;
import ch.flaes.flipperauth.domain.TimeEntryEntity;
import ch.flaes.flipperauth.repository.TimeEntryRepository;

@Service
public class TimeTrackingService {

    private final TimeEntryRepository timeEntryRepository;

    public TimeTrackingService(TimeEntryRepository timeEntryRepository) {
        this.timeEntryRepository = timeEntryRepository;
    }

    @Transactional
    public TimeTrackingResult apply(Long employeeId, AuthAction action) {
        return switch (action) {
            case LOGIN -> checkIn(employeeId);
            case LOGOUT -> checkOut(employeeId);
        };
    }

    private TimeTrackingResult checkIn(Long employeeId) {
        return timeEntryRepository.findFirstByEmployeeIdAndCheckOutIsNullOrderByCheckInDesc(employeeId)
                .map(entry -> new TimeTrackingResult(entry.getId(), true, "User already checked in"))
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    TimeEntryEntity entry = new TimeEntryEntity();
                    entry.setEmployeeId(employeeId);
                    entry.setCheckIn(now);
                    entry.setEntryDate(now.toLocalDate());
                    entry.setBreakMinutes(0);

                    TimeEntryEntity saved = timeEntryRepository.save(entry);
                    return new TimeTrackingResult(saved.getId(), true, "Check-in tracked");
                });
    }

    private TimeTrackingResult checkOut(Long employeeId) {
        return timeEntryRepository.findFirstByEmployeeIdAndCheckOutIsNullOrderByCheckInDesc(employeeId)
                .map(entry -> {
                    LocalDateTime checkOutTime = LocalDateTime.now();
                    long totalMinutes = Math.max(0, ChronoUnit.MINUTES.between(entry.getCheckIn(), checkOutTime));
                    int breakMinutes = entry.getBreakMinutes() != null ? entry.getBreakMinutes() : 0;
                    long netMinutes = Math.max(0, totalMinutes - breakMinutes);
                    BigDecimal totalHours = BigDecimal.valueOf(netMinutes)
                            .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

                    entry.setCheckOut(checkOutTime);
                    entry.setBreakMinutes(breakMinutes);
                    entry.setTotalHours(totalHours);

                    TimeEntryEntity saved = timeEntryRepository.save(entry);
                    return new TimeTrackingResult(saved.getId(), false, "Check-out tracked");
                })
                .orElseGet(() -> new TimeTrackingResult(null, false, "No open check-in found"));
    }

    public record TimeTrackingResult(Long timeEntryId, boolean checkedIn, String message) {
    }
}
