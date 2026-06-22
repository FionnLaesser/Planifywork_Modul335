package com.workforce.planning.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * HR-Stundenfreigabe pro Schichtleiter und Monat.
 * Schichtleiter dürfen diese Werte nicht selbst setzen, sondern nutzen sie beim Erstellen von Arbeitsplänen.
 */
@Data
@Entity
@Table(
        name = "hour_budgets",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_hour_budget_shiftlead_month",
                columnNames = {"shift_lead_id", "budget_year", "budget_month"}
        )
)
public class HourBudget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shift_lead_id", nullable = false)
    private Long shiftLeadId;

    @Column(name = "budget_year", nullable = false)
    private Integer year;

    @Column(name = "budget_month", nullable = false)
    private Integer month;

    @Column(name = "approved_hours", nullable = false, precision = 8, scale = 2)
    private BigDecimal approvedHours = BigDecimal.ZERO;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
