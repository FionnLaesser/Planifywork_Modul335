package com.workforce.absence.repository;

import com.workforce.absence.model.Absence;
import com.workforce.absence.model.AbsenceStatus;
import com.workforce.absence.model.AbsenceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Spring Data JPA Repository für die {@link Absence}-Entity.
 * Bietet gefilterte Abfragen für HR-Verwaltungsoperationen (US-HR-08, US-HR-09, US-HR-10).
 */
public interface AbsenceRepository extends JpaRepository<Absence, Long> {

    /**
     * Gibt alle Abwesenheiten mit dem Status PENDING zurück.
     * Wird für die offene Ferienanfragen-Liste (US-HR-08) verwendet.
     *
     * @param status Status-Filter (typischerweise PENDING)
     * @return Liste offener Anfragen, sortiert nach Erstellungsdatum
     */
    List<Absence> findByStatusOrderByCreatedAtAsc(AbsenceStatus status);

    /**
     * Gibt alle Abwesenheiten eines bestimmten Mitarbeiters zurück.
     *
     * @param employeeId ID des Mitarbeiters
     * @return alle Abwesenheiten dieses Mitarbeiters
     */
    List<Absence> findByEmployeeId(Long employeeId);

    /**
     * Gibt alle Abwesenheiten gefiltert nach Mitarbeiter und Typ zurück.
     * Wird für die Absenzen-Verwaltung (US-HR-09) verwendet.
     *
     * @param employeeId ID des Mitarbeiters
     * @param type       Abwesenheitstyp
     * @return gefilterte Liste
     */
    List<Absence> findByEmployeeIdAndType(Long employeeId, AbsenceType type);

    /**
     * Gibt alle Abwesenheiten eines bestimmten Typs zurück.
     *
     * @param type Abwesenheitstyp
     * @return Liste aller Abwesenheiten dieses Typs
     */
    List<Absence> findByType(AbsenceType type);
}
