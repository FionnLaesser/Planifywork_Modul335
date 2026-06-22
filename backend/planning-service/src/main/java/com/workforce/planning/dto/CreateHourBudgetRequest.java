package com.workforce.planning.dto;

import java.math.BigDecimal;

/** DTO zum Erstellen oder Aktualisieren einer HR-Stundenfreigabe. */
public record CreateHourBudgetRequest(
        Long shiftLeadId,
        Integer year,
        Integer month,
        BigDecimal approvedHours,
        Long createdBy,
        String notes
) {}
