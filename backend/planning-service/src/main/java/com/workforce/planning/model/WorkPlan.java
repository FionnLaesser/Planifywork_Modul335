package com.workforce.planning.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA-Entity für die Tabelle {@code work_plans}.
 * Ein Arbeitsplan gehört einem Schichtleiter und enthält mehrere Schichten.
 */
@Data
@Entity
@Table(name = "work_plans")
public class WorkPlan {

    /** Primärschlüssel, automatisch generiert. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Titel des Arbeitsplans, z.B. Monatsplan Juni. */
    @Column(nullable = false, length = 200)
    private String title;

    /** FK zu {@code users.id}; kein JPA-Join, da User im User-Service verwaltet werden. */
    @Column(name = "shift_lead_id", nullable = false)
    private Long shiftLeadId;

    /** Startdatum des Planungszeitraums. */
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /** Enddatum des Planungszeitraums. */
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /** FK zur HR-Stundenfreigabe, aus der das Kontingent übernommen wurde. */
    @Column(name = "hour_budget_id")
    private Long hourBudgetId;

    /** Von HR freigegebene Stunden für diesen Arbeitsplan/Monat. */
    @Column(name = "approved_hours", nullable = false, precision = 8, scale = 2)
    private BigDecimal approvedHours = BigDecimal.ZERO;

    /** Entwurf oder veröffentlicht. Mitarbeiter sehen nur veröffentlichte Schichten im Kalender. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WorkPlanStatus status = WorkPlanStatus.DRAFT;

    /** Erstellungszeitpunkt. */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** Zeitpunkt der Veröffentlichung. */
    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    /** Schichten des Arbeitsplans. */
    @OneToMany(mappedBy = "workPlan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Shift> shifts = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = WorkPlanStatus.DRAFT;
        }
        if (approvedHours == null) {
            approvedHours = BigDecimal.ZERO;
        }
    }
}
