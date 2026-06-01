package com.workforce.billing.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * JPA-Entity für die Tabelle {@code invoice_positions}.
 * Repräsentiert eine einzelne Position (Zeile) in einer Rechnung.
 */
@Data
@Entity
@Table(name = "invoice_positions")
public class InvoicePosition {

    /** Primärschlüssel, automatisch generiert */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Zugehörige Rechnung. Definiert die Beziehung zur Tabelle {@code invoices}.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    /** Beschreibung der Leistungsposition */
    private String description;

    /** Anzahl Stunden für diese Position */
    @Column(precision = 6, scale = 2)
    private BigDecimal hours;

    /** Stundensatz in CHF */
    @Column(precision = 8, scale = 2)
    private BigDecimal rate;

    /** Zwischensumme: hours * rate */
    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;
}
