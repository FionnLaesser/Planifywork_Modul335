package com.workforce.time.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * JPA-Entity für die Tabelle {@code time_entries}.
 * Speichert einen Check-in / Check-out Eintrag eines Mitarbeiters.
 * Die Gesamtstunden werden bei Check-out automatisch berechnet.
 */
@Data
@Entity
@Table(name = "time_entries")
public class TimeEntry {

    /** Primärschlüssel, automatisch generiert */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * FK zu {@code users.id} – der Mitarbeiter dem dieser Eintrag gehört.
     * Kein JPA-Join, da User in einem anderen Service verwaltet wird.
     */
    @Column(nullable = false)
    private Long employeeId;

    /** Zeitpunkt des Check-ins */
    private LocalDateTime checkIn;

    /** Zeitpunkt des Check-outs ({@code null} wenn noch eingecheckt) */
    private LocalDateTime checkOut;

    /** Pausenzeit in Minuten */
    private Integer breakMinutes = 0;

    /**
     * Netto-Arbeitsstunden des Tages.
     * Wird bei Check-out berechnet: (checkOut - checkIn) - breakMinutes.
     */
    @Column(precision = 5, scale = 2)
    private BigDecimal totalHours;

    /** Datum des Eintrags (entspricht dem Check-in Datum) */
    private LocalDate entryDate;

    /**
     * Setzt das Eintragsdatum automatisch vor dem ersten Persistieren.
     */
    @PrePersist
    void prePersist() {
        if (checkIn != null) {
            this.entryDate = checkIn.toLocalDate();
        }
    }
}
