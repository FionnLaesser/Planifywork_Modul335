package com.workforce.adminconfig.repository;

import com.workforce.adminconfig.model.WageRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WageRuleRepository extends JpaRepository<WageRule, Long> {
    List<WageRule> findAllByOrderByIdAsc();
}
