package com.workforce.order.dto;

import java.util.List;

public record AssignOrderRequest(
        Long shiftLeadId,
        List<Long> employeeIds
) {}
