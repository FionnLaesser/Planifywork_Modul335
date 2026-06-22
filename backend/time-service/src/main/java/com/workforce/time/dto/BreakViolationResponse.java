package com.workforce.time.dto;

import com.workforce.time.model.TimeEntry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Rückgabe-DTO für erkannte Pausenverstösse. */
public record BreakViolationResponse(
        Long id,
        Long employeeId,
        LocalDate entryDate,
        LocalDateTime checkIn,
        LocalDateTime checkOut,
        Integer breakMinutes,
        Integer requiredBreakMinutes,
        BigDecimal totalHours,
        String message
) {
    public static BreakViolationResponse from(TimeEntry entry, int requiredBreakMinutes) {
        int actualBreak = entry.getBreakMinutes() == null ? 0 : entry.getBreakMinutes();
        return new BreakViolationResponse(
                entry.getId(),
                entry.getEmployeeId(),
                entry.getEntryDate(),
                entry.getCheckIn(),
                entry.getCheckOut(),
                actualBreak,
                requiredBreakMinutes,
                entry.getTotalHours(),
                "Erfasste Pause " + actualBreak + " Min. liegt unter der erforderlichen Pause von "
                        + requiredBreakMinutes + " Min."
        );
    }
}
