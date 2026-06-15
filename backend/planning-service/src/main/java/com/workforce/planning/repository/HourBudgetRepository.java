package com.workforce.planning.repository;

import com.workforce.planning.model.HourBudget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/** Spring Data JPA Repository für HR-Stundenfreigaben. */
public interface HourBudgetRepository extends JpaRepository<HourBudget, Long> {

    Optional<HourBudget> findByShiftLeadIdAndYearAndMonth(Long shiftLeadId, Integer year, Integer month);

    List<HourBudget> findByShiftLeadIdOrderByYearDescMonthDesc(Long shiftLeadId);

    List<HourBudget> findAllByOrderByYearDescMonthDescShiftLeadIdAsc();
}
