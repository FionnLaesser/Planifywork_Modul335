package com.workforce.absence.dto;

import java.time.LocalDate;

/**
 * DTO für das Bearbeiten einer bestehenden Abwesenheit durch HR (US-HR-09).
 *
 * @param type      Abwesenheitstyp ("VACATION", "SICK", "OTHER")
 * @param startDate Neues Startdatum
 * @param endDate   Neues Enddatum
 * @param reason    Aktualisierte Begründung (optional)
 */
public record UpdateAbsenceRequest(
        String type,
        LocalDate startDate,
        LocalDate endDate,
        String reason
) {}
