package com.workforce.order.dto;

import com.workforce.order.model.OrderStatus;

import java.time.LocalDate;
import java.util.List;

public record UpdateOrderRequest(
        String title,
        String description,
        String company,
        String location,
        LocalDate startDate,
        LocalDate endDate,
        String requiredRole,
        OrderStatus status,
        Long assignedShiftLeadId,
        List<Long> employeeIds
) {}
