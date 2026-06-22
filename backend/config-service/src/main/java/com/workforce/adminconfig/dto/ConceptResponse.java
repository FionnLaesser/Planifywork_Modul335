package com.workforce.adminconfig.dto;

import com.workforce.adminconfig.model.CompanyConcept;

import java.time.LocalDateTime;

public record ConceptResponse(Long id, String name, String description, Boolean active, LocalDateTime createdAt) {
    public static ConceptResponse from(CompanyConcept c) {
        return new ConceptResponse(c.getId(), c.getName(), c.getDescription(), c.getActive(), c.getCreatedAt());
    }
}
