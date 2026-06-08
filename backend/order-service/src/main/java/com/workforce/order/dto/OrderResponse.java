package com.workforce.order.dto;

import com.workforce.order.model.OrderStatus;
import com.workforce.order.model.WorkOrder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String title,
        String description,
        String company,
        String location,
        LocalDate startDate,
        LocalDate endDate,
        String requiredRole,
        OrderStatus status,
        Long assignedShiftLeadId,
        Long createdBy,
        LocalDateTime createdAt,
        List<Long> employeeIds
) {
    public static OrderResponse from(WorkOrder order, List<Long> employeeIds) {
        return new OrderResponse(
                order.getId(),
                order.getTitle(),
                order.getDescription(),
                order.getCompany(),
                order.getLocation(),
                order.getStartDate(),
                order.getEndDate(),
                order.getRequiredRole(),
                order.getStatus(),
                order.getAssignedShiftLeadId(),
                order.getCreatedBy(),
                order.getCreatedAt(),
                employeeIds
        );
    }
}
