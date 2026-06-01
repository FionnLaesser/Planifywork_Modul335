package com.workforce.billing.dto;

import com.workforce.billing.model.Invoice;
import com.workforce.billing.model.InvoicePosition;
import com.workforce.billing.model.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO für die Rückgabe einer Rechnung an das Frontend.
 *
 * @param id         Rechnungs-ID
 * @param orderId    Auftrags-ID
 * @param createdBy  ID der erstellenden HR-Person
 * @param totalHours Gesamtstunden
 * @param amount     Gesamtbetrag in CHF
 * @param status     Rechnungsstatus (DRAFT, SENT, PAID)
 * @param createdAt  Erstellungszeitpunkt
 * @param positions  Liste der Rechnungspositionen
 */
public record InvoiceResponse(
        Long id,
        Long orderId,
        Long createdBy,
        BigDecimal totalHours,
        BigDecimal amount,
        InvoiceStatus status,
        LocalDateTime createdAt,
        List<PositionDetail> positions
) {
    /**
     * Eingebettetes DTO für eine einzelne Rechnungsposition.
     *
     * @param id          Positions-ID
     * @param description Beschreibung
     * @param hours       Stunden
     * @param rate        Stundensatz
     * @param subtotal    Zwischensumme
     */
    public record PositionDetail(
            Long id, String description,
            BigDecimal hours, BigDecimal rate, BigDecimal subtotal) {}

    /**
     * Factory-Methode: erstellt einen {@link InvoiceResponse} aus einer {@link Invoice}-Entity.
     *
     * @param invoice die Entity
     * @return gemapptes DTO
     */
    public static InvoiceResponse from(Invoice invoice) {
        List<PositionDetail> positions = invoice.getPositions().stream()
                .map(p -> new PositionDetail(
                        p.getId(), p.getDescription(),
                        p.getHours(), p.getRate(), p.getSubtotal()))
                .toList();

        return new InvoiceResponse(
                invoice.getId(),
                invoice.getOrderId(),
                invoice.getCreatedBy(),
                invoice.getTotalHours(),
                invoice.getAmount(),
                invoice.getStatus(),
                invoice.getCreatedAt(),
                positions
        );
    }
}
