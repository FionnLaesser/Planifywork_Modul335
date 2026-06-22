package com.workforce.adminconfig.dto;

import java.math.BigDecimal;

public record TimeRuleRequest(
        String name,
        BigDecimal maxDailyHours,
        BigDecimal maxWeeklyHours,
        BigDecimal breakAfterHours,
        Integer breakDurationMinutes,
        Boolean active
) {}
