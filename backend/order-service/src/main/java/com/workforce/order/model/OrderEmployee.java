package com.workforce.order.model;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "order_employees")
@Getter
@Setter
@NoArgsConstructor
public class OrderEmployee {

    @EmbeddedId
    private OrderEmployeeId id;

    public OrderEmployee(Long orderId, Long employeeId) {
        this.id = new OrderEmployeeId(orderId, employeeId);
    }
}
