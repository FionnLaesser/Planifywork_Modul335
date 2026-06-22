package com.workforce.planning.dto;

import com.workforce.planning.model.WorkPlan;
import com.workforce.planning.model.WorkPlanStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Rückgabe-DTO für einen Arbeitsplan inklusive Stundenübersicht. */
public record WorkPlanResponse(
        Long id,
        String title,
        Long shiftLeadId,
        Long hourBudgetId,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal approvedHours,
        BigDecimal plannedHours,
        BigDecimal remainingHours,
        boolean overLimit,
        boolean underPlanned,
        WorkPlanStatus status,
        LocalDateTime createdAt,
        LocalDateTime publishedAt,
        List<ShiftResponse> shifts
) {
    public static WorkPlanResponse from(
            WorkPlan workPlan,
            BigDecimal plannedHours,
            BigDecimal remainingHours,
            boolean overLimit,
            boolean underPlanned,
            List<ShiftResponse> shifts
    ) {
        return new WorkPlanResponse(
                workPlan.getId(),
                workPlan.getTitle(),
                workPlan.getShiftLeadId(),
                workPlan.getHourBudgetId(),
                workPlan.getStartDate(),
                workPlan.getEndDate(),
                workPlan.getApprovedHours(),
                plannedHours,
                remainingHours,
                overLimit,
                underPlanned,
                workPlan.getStatus(),
                workPlan.getCreatedAt(),
                workPlan.getPublishedAt(),
                shifts
        );
    }
}
