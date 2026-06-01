package com.workforce.billing.dto;

import java.util.List;

/**
 * DTO für das Erstellen einer neuen Rechnung (US-HR-06).
 *
 * @param orderId    FK zur Auftrags-ID aus dem Order Service
 * @param createdBy  ID der erstellenden HR-Person
 * @param positions  Liste der Rechnungspositionen
 */
public record CreateInvoiceRequest(
        Long orderId,
        Long createdBy,
        List<InvoicePositionRequest> positions
) {}
