package com.workforce.adminconfig.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "time_rules")
@Data
public class TimeRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "max_daily_hours", precision = 5, scale = 2)
    private BigDecimal maxDailyHours;

    @Column(name = "max_weekly_hours", precision = 5, scale = 2)
    private BigDecimal maxWeeklyHours;

    @Column(name = "break_after_hours", precision = 5, scale = 2)
    private BigDecimal breakAfterHours;

    @Column(name = "break_duration_minutes")
    private Integer breakDurationMinutes;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }
}
