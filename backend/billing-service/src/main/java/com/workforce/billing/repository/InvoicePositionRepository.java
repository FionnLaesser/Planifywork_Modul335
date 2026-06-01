package com.workforce.billing.repository;

import com.workforce.billing.model.InvoicePosition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** Repository fuer einzelne Rechnungspositionen. */
public interface InvoicePositionRepository extends JpaRepository<InvoicePosition, Long> {

    /**
     * Gibt alle Positionen einer bestimmten Rechnung zurueck.
     *
     * @param invoiceId ID der Rechnung
     * @return Liste der zugehoerigen Positionen
     */
    List<InvoicePosition> findByInvoiceId(Long invoiceId);
}
