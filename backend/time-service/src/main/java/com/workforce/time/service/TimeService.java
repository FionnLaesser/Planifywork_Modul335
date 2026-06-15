package com.workforce.time.service;

import com.workforce.time.dto.*;
import com.workforce.time.exception.ResourceNotFoundException;
import com.workforce.time.model.TimeEntry;
import com.workforce.time.repository.TimeEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/**
 * Service-Klasse für die Arbeitszeiterfassung und -auswertung.
 *
 * <p>Implementiert folgende User Stories:
 * <ul>
 *   <li>US-HR-04: Gesamtstunden aller Mitarbeiter einsehen</li>
 *   <li>US-HR-05: Detaillierte Stundenauswertung pro Mitarbeiter</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class TimeService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Europe/Zurich");

    private final TimeEntryRepository timeEntryRepository;

    /**
     * Gibt die Gesamtstunden aller Mitarbeiter in einem Datumsbereich zurück.
     * Implementiert US-HR-04 (Gesamtstunden einsehen).
     *
     * @param from Startdatum (inklusive)
     * @param to   Enddatum (inklusive)
     * @return Liste mit einer {@link TotalHoursResponse} pro Mitarbeiter
     */
    @Transactional(readOnly = true)
    public List<TotalHoursResponse> getTotalHours(LocalDate from, LocalDate to) {
        return timeEntryRepository.sumHoursByEmployeeAndDateRange(from, to).stream()
                .map(row -> new TotalHoursResponse(
                        ((Number) row[0]).longValue(),
                        row[1] == null ? BigDecimal.ZERO : new BigDecimal(row[1].toString())
                                .setScale(2, RoundingMode.HALF_UP)
                ))
                .toList();
    }

    /**
     * Gibt die Gesamtstunden eines einzelnen Mitarbeiters in einem Datumsbereich zurück.
     *
     * @param employeeId ID des Mitarbeiters
     * @param from Startdatum (inklusive)
     * @param to   Enddatum (inklusive)
     * @return Summe der Arbeitsstunden für diesen Mitarbeiter
     */
    @Transactional(readOnly = true)
    public TotalHoursResponse getTotalHoursForEmployee(Long employeeId, LocalDate from, LocalDate to) {
        BigDecimal sum = timeEntryRepository.sumHoursForEmployeeAndDateRange(employeeId, from, to);
        BigDecimal total = sum == null ? BigDecimal.ZERO : sum.setScale(2, RoundingMode.HALF_UP);
        return new TotalHoursResponse(employeeId, total);
    }

    /**
     * Gibt alle Zeiteinträge eines Mitarbeiters für einen bestimmten Monat zurück.
     * Implementiert US-HR-05 (Detaillierte Stundenauswertung).
     *
     * @param employeeId ID des Mitarbeiters
     * @param month      Monat (1–12)
     * @param year       Jahr (z.B. 2025)
     * @return Liste der Tageseinträge für diesen Monat
     */
    @Transactional(readOnly = true)
    public List<TimeEntryResponse> getMonthlyEntries(Long employeeId, int month, int year) {
        YearMonth ym   = YearMonth.of(year, month);
        LocalDate from = ym.atDay(1);
        LocalDate to   = ym.atEndOfMonth();

        return timeEntryRepository
                .findByEmployeeIdAndEntryDateBetweenOrderByEntryDateAsc(employeeId, from, to)
                .stream()
                .map(TimeEntryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<TimeEntryResponse> getCurrentEntry(Long employeeId) {
        return timeEntryRepository
                .findFirstByEmployeeIdAndCheckOutIsNullOrderByCheckInDesc(employeeId)
                .map(TimeEntryResponse::from);
    }

    @Transactional(readOnly = true)
    public Optional<TimeEntryResponse> getTodayEntry(Long employeeId) {
        return timeEntryRepository
                .findFirstByEmployeeIdAndEntryDateOrderByCheckInDesc(employeeId, LocalDate.now(BUSINESS_ZONE))
                .map(TimeEntryResponse::from);
    }

    @Transactional(readOnly = true)
    public Optional<TimeEntryResponse> getLatestEntry(Long employeeId) {
        return timeEntryRepository
                .findFirstByEmployeeIdOrderByCheckInDesc(employeeId)
                .map(TimeEntryResponse::from);
    }


    /**
     * Gibt erkannte Pausenverstösse in einem Datumsbereich zurück.
     * Regel: > 6h Brutto-Arbeitszeit = mind. 30 Min Pause, > 9h = mind. 45 Min Pause.
     */
    @Transactional(readOnly = true)
    public List<BreakViolationResponse> getBreakViolations(LocalDate from, LocalDate to, Long employeeId) {
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("to darf nicht vor from liegen");
        }

        List<TimeEntry> entries = employeeId != null
                ? timeEntryRepository.findByEmployeeIdAndEntryDateBetweenAndCheckOutIsNotNullOrderByEntryDateDesc(employeeId, from, to)
                : timeEntryRepository.findByEntryDateBetweenAndCheckOutIsNotNullOrderByEntryDateDesc(from, to);

        return entries.stream()
                .filter(this::hasBreakViolation)
                .map(entry -> BreakViolationResponse.from(entry, requiredBreakMinutes(entry)))
                .toList();
    }

    private boolean hasBreakViolation(TimeEntry entry) {
        int required = requiredBreakMinutes(entry);
        int actual = entry.getBreakMinutes() == null ? 0 : entry.getBreakMinutes();
        return required > 0 && actual < required;
    }

    private int requiredBreakMinutes(TimeEntry entry) {
        if (entry.getCheckIn() == null || entry.getCheckOut() == null) {
            return 0;
        }
        long grossMinutes = ChronoUnit.MINUTES.between(entry.getCheckIn(), entry.getCheckOut());
        if (grossMinutes > 9 * 60) {
            return 45;
        }
        if (grossMinutes > 6 * 60) {
            return 30;
        }
        return 0;
    }

    /**
     * Erfasst einen Check-in für einen Mitarbeiter.
     * Es darf nur ein offener Check-in pro Tag existieren.
     *
     * @param request DTO mit der Mitarbeiter-ID
     * @return der erstellte {@link TimeEntryResponse}
     * @throws IllegalStateException wenn bereits ein offener Check-in für heute existiert
     */
    @Transactional
    public TimeEntryResponse checkIn(CheckInRequest request) {
        if (request.employeeId() == null || request.employeeId() <= 0) {
            throw new IllegalArgumentException("employeeId ist erforderlich");
        }

        boolean alreadyCheckedIn = timeEntryRepository
                .findFirstByEmployeeIdAndCheckOutIsNullOrderByCheckInDesc(request.employeeId())
                .isPresent();

        if (alreadyCheckedIn) {
            throw new IllegalStateException(
                    "Mitarbeiter " + request.employeeId() + " ist bereits eingecheckt");
        }

        LocalDateTime now = LocalDateTime.now(BUSINESS_ZONE);
        TimeEntry entry = new TimeEntry();
        entry.setEmployeeId(request.employeeId());
        entry.setCheckIn(now);
        entry.setEntryDate(now.toLocalDate());

        return TimeEntryResponse.from(timeEntryRepository.save(entry));
    }

    /**
     * Erfasst einen Check-out für einen Mitarbeiter und berechnet die Nettostunden.
     * Nettostunden = (checkOut - checkIn) in Minuten - breakMinutes, umgerechnet in Stunden.
     *
     * @param request DTO mit Mitarbeiter-ID und Pausenzeit
     * @return aktualisierter {@link TimeEntryResponse} mit berechneten Stunden
     * @throws ResourceNotFoundException wenn kein offener Check-in für heute existiert
     */
    @Transactional
    public TimeEntryResponse checkOut(CheckOutRequest request) {
        if (request.employeeId() == null || request.employeeId() <= 0) {
            throw new IllegalArgumentException("employeeId ist erforderlich");
        }

        TimeEntry entry = timeEntryRepository
                .findFirstByEmployeeIdAndCheckOutIsNullOrderByCheckInDesc(request.employeeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Kein offener Check-in für Mitarbeiter " + request.employeeId()));

        LocalDateTime checkOutTime = LocalDateTime.now(BUSINESS_ZONE);
        int breakMinutes           = request.breakMinutes() != null ? request.breakMinutes() : 0;
        if (breakMinutes < 0) {
            throw new IllegalArgumentException("Pausenzeit darf nicht negativ sein");
        }

        long totalMinutes = ChronoUnit.MINUTES.between(entry.getCheckIn(), checkOutTime);
        long netMinutes   = Math.max(0, totalMinutes - breakMinutes);
        BigDecimal hours  = BigDecimal.valueOf(netMinutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        entry.setCheckOut(checkOutTime);
        entry.setBreakMinutes(breakMinutes);
        entry.setTotalHours(hours);

        return TimeEntryResponse.from(timeEntryRepository.save(entry));
    }
}
