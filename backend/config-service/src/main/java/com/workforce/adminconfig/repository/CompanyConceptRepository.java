package com.workforce.adminconfig.repository;

import com.workforce.adminconfig.model.CompanyConcept;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompanyConceptRepository extends JpaRepository<CompanyConcept, Long> {
    List<CompanyConcept> findAllByOrderByIdAsc();
}
