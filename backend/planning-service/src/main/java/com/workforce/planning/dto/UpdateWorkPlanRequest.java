package com.workforce.planning.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO zum Bearbeiten eines Arbeitsplan-Entwurfs.
 * approvedHours wird ignoriert, weil das Kontingent aus der HR-Stundenfreigabe kommt.
 */
public record UpdateWorkPlanRequest(
        String title,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal approvedHours
) {}
