package com.workforce.absence.model;

/**
 * Aufzählung der möglichen Status einer Abwesenheitsanfrage.
 * Der Status-Fluss ist: PENDING → APPROVED oder PENDING → REJECTED.
 */
public enum AbsenceStatus {

    /** Anfrage eingereicht, wartet auf HR-Entscheid */
    PENDING,

    /** Von HR genehmigt */
    APPROVED,

    /** Von HR abgelehnt */
    REJECTED
}
