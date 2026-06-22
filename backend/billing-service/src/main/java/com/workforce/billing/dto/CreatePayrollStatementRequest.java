package com.workforce.billing.dto;

import java.math.BigDecimal;

/** DTO zum Erstellen oder Neuberechnen eines monatlichen Lohnauszugs. */
public record CreatePayrollStatementRequest(
        Long employeeId,
        Integer year,
        Integer month,
        BigDecimal hourlyRate,
        BigDecimal bonusAmount,
        BigDecimal deductionAmount,
        Long createdBy
) {}
