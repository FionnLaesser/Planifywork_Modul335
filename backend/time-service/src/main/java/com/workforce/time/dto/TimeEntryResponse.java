package com.workforce.time.dto;

import com.workforce.time.model.TimeEntry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO für die Rückgabe eines einzelnen Zeiteintrags an das Frontend.
 *
 * @param id           Eintrag-ID
 * @param employeeId   Mitarbeiter-ID
 * @param checkIn      Check-in Zeitpunkt
 * @param checkOut     Check-out Zeitpunkt (null wenn noch offen)
 * @param breakMinutes Pausenzeit in Minuten
 * @param totalHours   Netto-Arbeitsstunden (null wenn noch offen)
 * @param entryDate    Datum des Eintrags
 */
public record TimeEntryResponse(
        Long id,
        Long employeeId,
        LocalDateTime checkIn,
        LocalDateTime checkOut,
        Integer breakMinutes,
        BigDecimal totalHours,
        LocalDate entryDate
) {
    /**
     * Factory-Methode: erstellt einen {@link TimeEntryResponse} aus einer {@link TimeEntry}-Entity.
     *
     * @param entry die Entity
     * @return gemapptes DTO
     */
    public static TimeEntryResponse from(TimeEntry entry) {
        return new TimeEntryResponse(
                entry.getId(),
                entry.getEmployeeId(),
                entry.getCheckIn(),
                entry.getCheckOut(),
                entry.getBreakMinutes(),
                entry.getTotalHours(),
                entry.getEntryDate()
        );
    }
}
