package com.workforce.time.repository;

import com.workforce.time.model.TimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository für die {@link TimeEntry}-Entity.
 * Bietet Abfragen für Check-in/out Auswertungen (US-HR-04, US-HR-05).
 */
public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {

    /**
     * Gibt alle Zeiteinträge eines Mitarbeiters im angegebenen Datumsbereich zurück.
     * Wird für die Monatsauswertung (US-HR-05) verwendet.
     *
     * @param employeeId ID des Mitarbeiters
     * @param from       Startdatum (inklusive)
     * @param to         Enddatum (inklusive)
     * @return sortierte Liste der Einträge
     */
    List<TimeEntry> findByEmployeeIdAndEntryDateBetweenOrderByEntryDateAsc(
            Long employeeId, LocalDate from, LocalDate to);

    /**
     * Gibt alle Zeiteinträge eines Mitarbeiters zurück.
     *
     * @param employeeId ID des Mitarbeiters
     * @return alle Einträge des Mitarbeiters
     */
    List<TimeEntry> findByEmployeeId(Long employeeId);

    /**
     * Gibt den heutigen offenen Check-in eines Mitarbeiters zurück
     * (check_out ist noch NULL).
     *
     * @param employeeId ID des Mitarbeiters
     * @param today      heutiges Datum
     * @return offener Check-in Eintrag, falls vorhanden
     */
    Optional<TimeEntry> findByEmployeeIdAndEntryDateAndCheckOutIsNull(
            Long employeeId, LocalDate today);

    Optional<TimeEntry> findFirstByEmployeeIdAndCheckOutIsNullOrderByCheckInDesc(Long employeeId);

    /**
     * Berechnet die Gesamtstunden aller Mitarbeiter in einem Datumsbereich.
     * Gibt pro Mitarbeiter eine Zeile mit der Summer der Stunden zurück.
     * Wird für die Gesamtübersicht (US-HR-04) verwendet.
     *
     * @param from Startdatum
     * @param to   Enddatum
     * @return Liste aus [employeeId, sumHours]
     */
    @Query("SELECT t.employeeId, SUM(t.totalHours) FROM TimeEntry t " +
           "WHERE t.entryDate BETWEEN :from AND :to AND t.totalHours IS NOT NULL " +
           "GROUP BY t.employeeId")
    List<Object[]> sumHoursByEmployeeAndDateRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
