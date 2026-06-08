package com.workforce.order.service;

import com.workforce.order.dto.*;
import com.workforce.order.exception.ResourceNotFoundException;
import com.workforce.order.model.OrderEmployee;
import com.workforce.order.model.OrderStatus;
import com.workforce.order.model.WorkOrder;
import com.workforce.order.repository.OrderEmployeeRepository;
import com.workforce.order.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final WorkOrderRepository orderRepository;
    private final OrderEmployeeRepository orderEmployeeRepository;

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders(Long shiftLeadId, OrderStatus status) {
        List<WorkOrder> orders;
        if (shiftLeadId != null && status != null) {
            orders = orderRepository.findByAssignedShiftLeadIdAndStatus(shiftLeadId, status);
        } else if (shiftLeadId != null) {
            orders = orderRepository.findByAssignedShiftLeadId(shiftLeadId);
        } else if (status != null) {
            orders = orderRepository.findByStatus(status);
        } else {
            orders = orderRepository.findAll();
        }
        return orders.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getById(Long id) {
        return toResponse(findOrder(id));
    }

    @Transactional
    public OrderResponse create(CreateOrderRequest request) {
        validateDates(request.startDate(), request.endDate());
        WorkOrder order = new WorkOrder();
        order.setTitle(request.title().trim());
        order.setDescription(blankToNull(request.description()));
        order.setCompany(blankToNull(request.company()));
        order.setLocation(blankToNull(request.location()));
        order.setStartDate(request.startDate());
        order.setEndDate(request.endDate());
        order.setRequiredRole(blankToNull(request.requiredRole()));
        order.setStatus(request.status() == null ? OrderStatus.OPEN : request.status());
        order.setAssignedShiftLeadId(request.assignedShiftLeadId());
        order.setCreatedBy(request.createdBy());
        WorkOrder saved = orderRepository.save(order);
        replaceEmployees(saved.getId(), request.employeeIds());
        return toResponse(saved);
    }

    @Transactional
    public OrderResponse update(Long id, UpdateOrderRequest request) {
        validateDates(request.startDate(), request.endDate());
        WorkOrder order = findOrder(id);
        if (request.title() != null && !request.title().isBlank()) order.setTitle(request.title().trim());
        if (request.description() != null) order.setDescription(blankToNull(request.description()));
        if (request.company() != null) order.setCompany(blankToNull(request.company()));
        if (request.location() != null) order.setLocation(blankToNull(request.location()));
        if (request.startDate() != null) order.setStartDate(request.startDate());
        if (request.endDate() != null) order.setEndDate(request.endDate());
        if (request.requiredRole() != null) order.setRequiredRole(blankToNull(request.requiredRole()));
        if (request.status() != null) order.setStatus(request.status());
        if (request.assignedShiftLeadId() != null) order.setAssignedShiftLeadId(request.assignedShiftLeadId());
        WorkOrder saved = orderRepository.save(order);
        if (request.employeeIds() != null) replaceEmployees(saved.getId(), request.employeeIds());
        return toResponse(saved);
    }

    @Transactional
    public OrderResponse assign(Long id, AssignOrderRequest request) {
        WorkOrder order = findOrder(id);
        order.setAssignedShiftLeadId(request.shiftLeadId());
        WorkOrder saved = orderRepository.save(order);
        replaceEmployees(saved.getId(), request.employeeIds());
        return toResponse(saved);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, UpdateOrderStatusRequest request) {
        WorkOrder order = findOrder(id);
        order.setStatus(request.status());
        return toResponse(orderRepository.save(order));
    }

    private WorkOrder findOrder(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Auftrag mit ID " + id + " nicht gefunden"));
    }

    private void replaceEmployees(Long orderId, List<Long> employeeIds) {
        orderEmployeeRepository.deleteByOrderId(orderId);
        if (employeeIds == null) return;
        employeeIds.stream()
                .filter(employeeId -> employeeId != null && employeeId > 0)
                .distinct()
                .map(employeeId -> new OrderEmployee(orderId, employeeId))
                .forEach(orderEmployeeRepository::save);
    }

    private OrderResponse toResponse(WorkOrder order) {
        List<Long> employeeIds = orderEmployeeRepository.findByOrderId(order.getId()).stream()
                .map(orderEmployee -> orderEmployee.getId().getEmployeeId())
                .toList();
        return OrderResponse.from(order, employeeIds);
    }

    private void validateDates(java.time.LocalDate start, java.time.LocalDate end) {
        if (start != null && end != null && start.isAfter(end)) {
            throw new IllegalArgumentException("Startdatum darf nicht nach dem Enddatum liegen");
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
