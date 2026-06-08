package com.workforce.order.dto;

import com.workforce.order.model.OrderStatus;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public record CreateOrderRequest(
        @NotBlank String title,
        String description,
        String company,
        String location,
        LocalDate startDate,
        LocalDate endDate,
        String requiredRole,
        OrderStatus status,
        Long assignedShiftLeadId,
        Long createdBy,
        List<Long> employeeIds
) {}
