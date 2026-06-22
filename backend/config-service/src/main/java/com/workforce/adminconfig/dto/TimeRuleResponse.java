package com.workforce.adminconfig.dto;

import com.workforce.adminconfig.model.TimeRule;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TimeRuleResponse(
        Long id,
        String name,
        BigDecimal maxDailyHours,
        BigDecimal maxWeeklyHours,
        BigDecimal breakAfterHours,
        Integer breakDurationMinutes,
        Boolean active,
        LocalDateTime createdAt
) {
    public static TimeRuleResponse from(TimeRule t) {
        return new TimeRuleResponse(
                t.getId(), t.getName(),
                t.getMaxDailyHours(), t.getMaxWeeklyHours(),
                t.getBreakAfterHours(), t.getBreakDurationMinutes(),
                t.getActive(), t.getCreatedAt());
    }
}
