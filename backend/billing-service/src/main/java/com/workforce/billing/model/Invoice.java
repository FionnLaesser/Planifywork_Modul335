package com.workforce.billing.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA-Entity für die Tabelle {@code invoices}.
 * Repräsentiert eine Rechnung die von HR für einen abgeschlossenen Auftrag erstellt wird.
 */
@Data
@Entity
@Table(name = "invoices")
public class Invoice {

    /** Primärschlüssel, automatisch generiert */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * FK zu {@code orders.id} – der Auftrag für den diese Rechnung gilt.
     * Kein JPA-Join, da Orders in einem anderen Service verwaltet werden.
     */
    private Long orderId;

    /**
     * FK zu {@code users.id} – die HR-Person die die Rechnung erstellt hat.
     */
    private Long createdBy;

    /** Gesamte geleistete Stunden für diese Rechnung */
    @Column(precision = 8, scale = 2)
    private BigDecimal totalHours;

    /** Gesamtbetrag der Rechnung in CHF */
    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    /** Aktueller Status der Rechnung (DRAFT, SENT, PAID) */
    @Enumerated(EnumType.STRING)
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    /** Zeitstempel der Erstellung */
    private LocalDateTime createdAt;

    /**
     * Positionen dieser Rechnung.
     * Werden beim Laden der Rechnung mitgeladen (EAGER) und
     * bei Löschung der Rechnung ebenfalls gelöscht (CASCADE ALL).
     */
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<InvoicePosition> positions = new ArrayList<>();

    /**
     * Setzt den Erstellungszeitpunkt automatisch vor dem ersten Persistieren.
     */
    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
