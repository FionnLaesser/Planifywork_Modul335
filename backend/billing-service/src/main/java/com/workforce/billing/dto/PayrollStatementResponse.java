package com.workforce.billing.dto;

import com.workforce.billing.model.PayrollStatement;
import com.workforce.billing.model.PayrollStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Rückgabe-DTO für monatliche Lohnauszüge. */
public record PayrollStatementResponse(
        Long id,
        Long employeeId,
        Integer year,
        Integer month,
        BigDecimal hourlyRate,
        BigDecimal totalHours,
        BigDecimal grossAmount,
        BigDecimal bonusAmount,
        BigDecimal deductionAmount,
        BigDecimal netAmount,
        PayrollStatus status,
        Long createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PayrollStatementResponse from(PayrollStatement statement) {
        return new PayrollStatementResponse(
                statement.getId(),
                statement.getEmployeeId(),
                statement.getYear(),
                statement.getMonth(),
                statement.getHourlyRate(),
                statement.getTotalHours(),
                statement.getGrossAmount(),
                statement.getBonusAmount(),
                statement.getDeductionAmount(),
                statement.getNetAmount(),
                statement.getStatus(),
                statement.getCreatedBy(),
                statement.getCreatedAt(),
                statement.getUpdatedAt()
        );
    }
}
