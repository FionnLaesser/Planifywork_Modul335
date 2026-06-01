package com.workforce.billing.repository;

import com.workforce.billing.model.Invoice;
import com.workforce.billing.model.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Spring Data JPA Repository für die {@link Invoice}-Entity.
 * Bietet statusbasierte und auftragsbasierte Abfragen für HR (US-HR-06, US-HR-07).
 */
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    /**
     * Gibt alle Rechnungen mit einem bestimmten Status zurück.
     * Wird für die Rechnungsübersicht mit Statusfilter (US-HR-07) verwendet.
     *
     * @param status Rechnungsstatus (DRAFT, SENT, PAID)
     * @return Liste der Rechnungen, neueste zuerst
     */
    List<Invoice> findByStatusOrderByCreatedAtDesc(InvoiceStatus status);

    /**
     * Gibt alle Rechnungen zurück, neueste zuerst.
     *
     * @return alle Rechnungen
     */
    List<Invoice> findAllByOrderByCreatedAtDesc();

    /**
     * Gibt alle Rechnungen für einen bestimmten Auftrag zurück.
     *
     * @param orderId ID des Auftrags
     * @return Rechnungen zu diesem Auftrag
     */
    List<Invoice> findByOrderId(Long orderId);
}
