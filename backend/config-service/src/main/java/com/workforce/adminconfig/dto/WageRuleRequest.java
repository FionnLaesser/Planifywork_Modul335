package com.workforce.adminconfig.dto;

import java.math.BigDecimal;

public record WageRuleRequest(
        String name,
        BigDecimal hourlyRate,
        BigDecimal overtimeRate,
        Long conceptId,
        Boolean active
) {}
