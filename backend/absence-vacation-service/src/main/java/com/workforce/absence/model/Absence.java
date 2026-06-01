package com.workforce.absence.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * JPA-Entity für die Tabelle {@code absences}.
 * Repräsentiert eine Abwesenheitsanfrage eines Mitarbeiters
 * (Ferien, Krankheit oder Sonstiges).
 */
@Data
@Entity
@Table(name = "absences")
public class Absence {

    /** Primärschlüssel, automatisch generiert */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * FK zu {@code users.id} – der Mitarbeiter der die Anfrage gestellt hat.
     * Kein JPA-Join, da User in einem anderen Service verwaltet wird.
     */
    @Column(nullable = false)
    private Long employeeId;

    /** Typ der Abwesenheit (VACATION, SICK, OTHER) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AbsenceType type;

    /** Startdatum der Abwesenheit (inklusive) */
    @Column(nullable = false)
    private LocalDate startDate;

    /** Enddatum der Abwesenheit (inklusive) */
    @Column(nullable = false)
    private LocalDate endDate;

    /** Optionale Begründung des Mitarbeiters */
    private String reason;

    /** Aktueller Status der Anfrage (PENDING, APPROVED, REJECTED) */
    @Enumerated(EnumType.STRING)
    private AbsenceStatus status = AbsenceStatus.PENDING;

    /**
     * FK zu {@code users.id} – die HR-Person die den Entscheid getroffen hat.
     * {@code null} wenn noch ausstehend.
     */
    private Long reviewedBy;

    /**
     * Optionale Ablehnungsbegründung durch HR.
     * Nur gesetzt wenn {@code status == REJECTED}.
     */
    private String rejectionReason;

    /** Zeitstempel der Erstellung der Anfrage */
    private LocalDateTime createdAt;

    /**
     * Setzt den Erstellungszeitpunkt automatisch vor dem ersten Persistieren.
     */
    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
