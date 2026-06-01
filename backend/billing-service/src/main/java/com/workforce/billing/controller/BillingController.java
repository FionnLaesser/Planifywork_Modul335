package com.workforce.billing.controller;

import com.workforce.billing.dto.CreateInvoiceRequest;
import com.workforce.billing.dto.InvoiceResponse;
import com.workforce.billing.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST-Controller für das Rechnungswesen.
 *
 * <p>Implementiert folgende User Stories:
 * <ul>
 *   <li>US-HR-06: {@code POST /api/billing/invoices} – Rechnung erstellen</li>
 *   <li>US-HR-07: {@code GET /api/billing/invoices}, {@code PUT .../send}, {@code PUT .../pay}</li>
 * </ul>
 *
 * <p>Alle Endpunkte sind auf die Rollen {@code HR} und {@code ADMIN} beschränkt.
 * Basis-URL: {@code /api/billing}
 */
@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:3002", "http://localhost:3003"})
public class BillingController {

    private final BillingService billingService;

    /**
     * Gibt alle Rechnungen zurück, optional gefiltert nach Status.
     * US-HR-07: Rechnungsübersicht mit Statusfilter.
     *
     * @param status Statusfilter (DRAFT, SENT, PAID) – optional
     * @return Liste der Rechnungen, neueste zuerst
     */
    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<List<InvoiceResponse>> getAll(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(billingService.getAll(status));
    }

    /**
     * Gibt eine einzelne Rechnung anhand ihrer ID zurück.
     *
     * @param id Rechnungs-ID im URL-Pfad
     * @return {@link InvoiceResponse} mit allen Positionen
     */
    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<InvoiceResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.getById(id));
    }

    /**
     * Erstellt eine neue Rechnung als Entwurf.
     * US-HR-06: Rechnung erstellen.
     *
     * @param request DTO mit Auftrags-ID, HR-Person und Positionen
     * @return neu erstellte Rechnung mit HTTP 201 Created und Status DRAFT
     */
    @PostMapping("/invoices")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<InvoiceResponse> create(@RequestBody CreateInvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(billingService.create(request));
    }

    /**
     * Setzt den Status einer Rechnung auf SENT (versendet).
     * US-HR-07: Rechnung versenden (DRAFT → SENT).
     *
     * @param id Rechnungs-ID im URL-Pfad
     * @return aktualisierte Rechnung mit Status SENT
     */
    @PutMapping("/invoices/{id}/send")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<InvoiceResponse> send(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.send(id));
    }

    /**
     * Markiert eine Rechnung als bezahlt (SENT → PAID).
     * US-HR-07: Rechnung als bezahlt markieren.
     *
     * @param id Rechnungs-ID im URL-Pfad
     * @return aktualisierte Rechnung mit Status PAID
     */
    @PutMapping("/invoices/{id}/pay")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<InvoiceResponse> pay(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.markPaid(id));
    }
}
