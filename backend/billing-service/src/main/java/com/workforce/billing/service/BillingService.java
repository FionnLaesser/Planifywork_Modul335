package com.workforce.billing.service;

import com.workforce.billing.dto.CreateInvoiceRequest;
import com.workforce.billing.dto.InvoiceResponse;
import com.workforce.billing.exception.ResourceNotFoundException;
import com.workforce.billing.model.Invoice;
import com.workforce.billing.model.InvoicePosition;
import com.workforce.billing.model.InvoiceStatus;
import com.workforce.billing.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Service-Klasse für das Rechnungswesen.
 *
 * <p>Implementiert folgende User Stories:
 * <ul>
 *   <li>US-HR-06: Rechnung erstellen</li>
 *   <li>US-HR-07: Rechnungen verwalten (Status-Übergänge)</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class BillingService {

    private final InvoiceRepository invoiceRepository;

    /**
     * Gibt alle Rechnungen zurück, optional gefiltert nach Status.
     * Implementiert US-HR-07 (Rechnungsübersicht).
     *
     * @param status Statusfilter (optional, z.B. "DRAFT", "SENT", "PAID")
     * @return Liste der Rechnungen, neueste zuerst
     */
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAll(String status) {
        List<Invoice> invoices = status != null
                ? invoiceRepository.findByStatusOrderByCreatedAtDesc(InvoiceStatus.valueOf(status))
                : invoiceRepository.findAllByOrderByCreatedAtDesc();

        return invoices.stream().map(InvoiceResponse::from).toList();
    }

    /**
     * Gibt eine einzelne Rechnung anhand ihrer ID zurück.
     *
     * @param id Rechnungs-ID
     * @return {@link InvoiceResponse}
     * @throws ResourceNotFoundException wenn keine Rechnung mit dieser ID existiert
     */
    @Transactional(readOnly = true)
    public InvoiceResponse getById(Long id) {
        return InvoiceResponse.from(findOrThrow(id));
    }

    /**
     * Erstellt eine neue Rechnung als Entwurf (Status: DRAFT).
     * Berechnet pro Position die Zwischensumme (hours * rate)
     * und summiert alle Positionen zum Gesamtbetrag.
     * Implementiert US-HR-06 (Rechnung erstellen).
     *
     * @param request DTO mit Auftrags-ID, HR-Person und Rechnungspositionen
     * @return neu erstellter {@link InvoiceResponse} mit Status DRAFT
     */
    @Transactional
    public InvoiceResponse create(CreateInvoiceRequest request) {
        Invoice invoice = new Invoice();
        invoice.setOrderId(request.orderId());
        invoice.setCreatedBy(request.createdBy());

        List<InvoicePosition> positions = request.positions().stream().map(posReq -> {
            InvoicePosition pos = new InvoicePosition();
            pos.setDescription(posReq.description());
            pos.setHours(posReq.hours());
            pos.setRate(posReq.rate());
            pos.setSubtotal(posReq.hours().multiply(posReq.rate())
                    .setScale(2, RoundingMode.HALF_UP));
            pos.setInvoice(invoice);
            return pos;
        }).toList();

        invoice.setPositions(positions);

        BigDecimal totalHours = positions.stream()
                .map(InvoicePosition::getHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal amount = positions.stream()
                .map(InvoicePosition::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        invoice.setTotalHours(totalHours);
        invoice.setAmount(amount);

        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    /**
     * Setzt den Status einer Rechnung auf SENT.
     * Implementiert US-HR-07 (Rechnung versenden).
     *
     * @param id Rechnungs-ID
     * @return aktualisierter {@link InvoiceResponse}
     * @throws ResourceNotFoundException wenn die Rechnung nicht existiert
     * @throws IllegalStateException     wenn die Rechnung nicht im Status DRAFT ist
     */
    @Transactional
    public InvoiceResponse send(Long id) {
        Invoice invoice = findOrThrow(id);
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new IllegalStateException(
                    "Nur Entwürfe können versendet werden (aktueller Status: "
                    + invoice.getStatus() + ")");
        }
        invoice.setStatus(InvoiceStatus.SENT);
        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    /**
     * Markiert eine Rechnung als bezahlt (Status: PAID).
     * Implementiert US-HR-07 (Rechnung als bezahlt markieren).
     *
     * @param id Rechnungs-ID
     * @return aktualisierter {@link InvoiceResponse}
     * @throws ResourceNotFoundException wenn die Rechnung nicht existiert
     * @throws IllegalStateException     wenn die Rechnung nicht im Status SENT ist
     */
    @Transactional
    public InvoiceResponse markPaid(Long id) {
        Invoice invoice = findOrThrow(id);
        if (invoice.getStatus() != InvoiceStatus.SENT) {
            throw new IllegalStateException(
                    "Nur versendete Rechnungen können als bezahlt markiert werden");
        }
        invoice.setStatus(InvoiceStatus.PAID);
        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    /**
     * Hilfsmethode: sucht eine Rechnung und wirft Exception wenn nicht gefunden.
     *
     * @param id Rechnungs-ID
     * @return die gefundene {@link Invoice}-Entity
     * @throws ResourceNotFoundException wenn nicht gefunden
     */
    private Invoice findOrThrow(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Rechnung mit ID " + id + " nicht gefunden"));
    }
}
