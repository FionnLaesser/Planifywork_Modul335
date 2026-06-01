package com.workforce.absence.dto;

import java.time.LocalDate;

/**
 * DTO für das Einreichen einer neuen Abwesenheitsanfrage (US-HR-09 / Flutter App).
 *
 * @param employeeId ID des Mitarbeiters der die Anfrage stellt
 * @param type       Abwesenheitstyp ("VACATION", "SICK", "OTHER")
 * @param startDate  Startdatum der Abwesenheit
 * @param endDate    Enddatum der Abwesenheit
 * @param reason     Optionale Begründung
 */
public record CreateAbsenceRequest(
        Long employeeId,
        String type,
        LocalDate startDate,
        LocalDate endDate,
        String reason
) {}
