package com.workforce.billing.dto;

import java.math.BigDecimal;

/**
 * DTO für eine einzelne Rechnungsposition bei der Rechnungserstellung (US-HR-06).
 *
 * @param description Beschreibung der Leistung
 * @param hours       Anzahl Stunden
 * @param rate        Stundensatz in CHF
 */
public record InvoicePositionRequest(
        String description,
        BigDecimal hours,
        BigDecimal rate
) {}
