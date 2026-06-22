package com.workforce.adminconfig.repository;

import com.workforce.adminconfig.model.TimeRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeRuleRepository extends JpaRepository<TimeRule, Long> {
    List<TimeRule> findAllByOrderByIdAsc();
}
