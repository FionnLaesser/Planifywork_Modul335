package com.workforce.billing.repository;

import com.workforce.billing.model.PayrollStatement;
import com.workforce.billing.model.PayrollStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/** Spring Data JPA Repository für Lohnauszüge. */
public interface PayrollStatementRepository extends JpaRepository<PayrollStatement, Long> {

    Optional<PayrollStatement> findByEmployeeIdAndYearAndMonth(Long employeeId, Integer year, Integer month);

    List<PayrollStatement> findByStatusOrderByYearDescMonthDescEmployeeIdAsc(PayrollStatus status);

    List<PayrollStatement> findAllByOrderByYearDescMonthDescEmployeeIdAsc();
}
