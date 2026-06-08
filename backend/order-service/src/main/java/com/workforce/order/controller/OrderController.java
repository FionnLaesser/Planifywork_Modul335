package com.workforce.order.controller;

import com.workforce.order.dto.*;
import com.workforce.order.model.OrderStatus;
import com.workforce.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR','SHIFT_LEAD','EMPLOYEE')")
    public ResponseEntity<List<OrderResponse>> getOrders(
            @RequestParam(required = false) Long shiftLeadId,
            @RequestParam(required = false) OrderStatus status) {
        return ResponseEntity.ok(orderService.getOrders(shiftLeadId, status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR','SHIFT_LEAD','EMPLOYEE')")
    public ResponseEntity<OrderResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderResponse> update(@PathVariable Long id, @RequestBody UpdateOrderRequest request) {
        return ResponseEntity.ok(orderService.update(id, request));
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderResponse> assign(@PathVariable Long id, @RequestBody AssignOrderRequest request) {
        return ResponseEntity.ok(orderService.assign(id, request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','SHIFT_LEAD')")
    public ResponseEntity<OrderResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateStatus(id, request));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('ADMIN','HR','SHIFT_LEAD','EMPLOYEE')")
    public ResponseEntity<OrderResponse> download(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getById(id));
    }
}
