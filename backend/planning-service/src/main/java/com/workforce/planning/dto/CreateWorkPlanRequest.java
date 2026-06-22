package com.workforce.planning.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO zum Erstellen eines Arbeitsplans.
 *
 * <p>Das Stundenkontingent wird nicht vom Schichtleiter bestimmt, sondern anhand der
 * HR-Stundenfreigabe für {@code shiftLeadId + Monat/Jahr} automatisch übernommen.
 * {@code approvedHours} bleibt nur aus Abwärtskompatibilitätsgründen im DTO und wird ignoriert.</p>
 */
public record CreateWorkPlanRequest(
        String title,
        Long shiftLeadId,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal approvedHours
) {}
