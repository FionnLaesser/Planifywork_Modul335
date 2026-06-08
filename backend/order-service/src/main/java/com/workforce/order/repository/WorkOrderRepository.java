package com.workforce.order.repository;

import com.workforce.order.model.OrderStatus;
import com.workforce.order.model.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    List<WorkOrder> findByAssignedShiftLeadId(Long shiftLeadId);
    List<WorkOrder> findByStatus(OrderStatus status);
    List<WorkOrder> findByAssignedShiftLeadIdAndStatus(Long shiftLeadId, OrderStatus status);
}
