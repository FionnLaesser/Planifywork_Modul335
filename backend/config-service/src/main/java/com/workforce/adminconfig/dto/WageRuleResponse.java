package com.workforce.adminconfig.dto;

import com.workforce.adminconfig.model.WageRule;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WageRuleResponse(
        Long id,
        String name,
        BigDecimal hourlyRate,
        BigDecimal overtimeRate,
        Long conceptId,
        Boolean active,
        LocalDateTime createdAt
) {
    public static WageRuleResponse from(WageRule w) {
        return new WageRuleResponse(
                w.getId(), w.getName(),
                w.getHourlyRate(), w.getOvertimeRate(),
                w.getConceptId(), w.getActive(), w.getCreatedAt());
    }
}
