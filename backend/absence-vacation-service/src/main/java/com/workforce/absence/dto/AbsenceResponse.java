package com.workforce.absence.dto;

import com.workforce.absence.model.Absence;
import com.workforce.absence.model.AbsenceStatus;
import com.workforce.absence.model.AbsenceType;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO für die Rückgabe einer Abwesenheit an das Frontend.
 *
 * @param id              Eintrag-ID
 * @param employeeId      Mitarbeiter-ID
 * @param type            Abwesenheitstyp (VACATION, SICK, OTHER)
 * @param startDate       Startdatum
 * @param endDate         Enddatum
 * @param reason          Begründung des Mitarbeiters
 * @param status          Status (PENDING, APPROVED, REJECTED)
 * @param reviewedBy      ID der HR-Person die entschieden hat
 * @param rejectionReason Ablehnungsbegründung (nur bei REJECTED)
 * @param createdAt       Erstellungszeitpunkt
 */
public record AbsenceResponse(
        Long id,
        Long employeeId,
        AbsenceType type,
        LocalDate startDate,
        LocalDate endDate,
        String reason,
        AbsenceStatus status,
        Long reviewedBy,
        String rejectionReason,
        LocalDateTime createdAt
) {
    /**
     * Factory-Methode: erstellt einen {@link AbsenceResponse} aus einer {@link Absence}-Entity.
     *
     * @param absence die Entity
     * @return gemapptes DTO
     */
    public static AbsenceResponse from(Absence absence) {
        return new AbsenceResponse(
                absence.getId(),
                absence.getEmployeeId(),
                absence.getType(),
                absence.getStartDate(),
                absence.getEndDate(),
                absence.getReason(),
                absence.getStatus(),
                absence.getReviewedBy(),
                absence.getRejectionReason(),
                absence.getCreatedAt()
        );
    }
}
