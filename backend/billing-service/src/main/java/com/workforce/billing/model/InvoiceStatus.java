package com.workforce.billing.model;

/**
 * Aufzählung der möglichen Status einer Rechnung.
 * Status-Fluss: DRAFT → SENT → PAID.
 */
public enum InvoiceStatus {

    /** Rechnung als Entwurf gespeichert, noch nicht versendet */
    DRAFT,

    /** Rechnung wurde an den Kunden gesendet */
    SENT,

    /** Rechnung wurde bezahlt */
    PAID
}
