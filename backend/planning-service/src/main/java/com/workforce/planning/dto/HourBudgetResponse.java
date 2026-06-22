package com.workforce.planning.dto;

import com.workforce.planning.model.HourBudget;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Rückgabe-DTO für HR-Stundenfreigaben. */
public record HourBudgetResponse(
        Long id,
        Long shiftLeadId,
        Integer year,
        Integer month,
        BigDecimal approvedHours,
        Long createdBy,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static HourBudgetResponse from(HourBudget budget) {
        return new HourBudgetResponse(
                budget.getId(),
                budget.getShiftLeadId(),
                budget.getYear(),
                budget.getMonth(),
                budget.getApprovedHours(),
                budget.getCreatedBy(),
                budget.getNotes(),
                budget.getCreatedAt(),
                budget.getUpdatedAt()
        );
    }
}
