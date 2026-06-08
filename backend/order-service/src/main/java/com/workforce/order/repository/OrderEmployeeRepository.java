package com.workforce.order.repository;

import com.workforce.order.model.OrderEmployee;
import com.workforce.order.model.OrderEmployeeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderEmployeeRepository extends JpaRepository<OrderEmployee, OrderEmployeeId> {

    @Query("select oe from OrderEmployee oe where oe.id.orderId = :orderId")
    List<OrderEmployee> findByOrderId(@Param("orderId") Long orderId);

    @Modifying
    @Query("delete from OrderEmployee oe where oe.id.orderId = :orderId")
    void deleteByOrderId(@Param("orderId") Long orderId);
}
