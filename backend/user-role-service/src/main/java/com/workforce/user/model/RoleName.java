package com.workforce.user.model;

/**
 * Aufzählung aller verfügbaren Rollen im Workforce Management System.
 * Wird in der Tabelle {@code roles} gespeichert und als JWT-Claim übertragen.
 */
public enum RoleName {

    /** Systemadministrator mit allen Rechten */
    ADMIN,

    /** HR-Mitarbeiterin: Stunden, Rechnungen, Absenzen, Schichtleiterverwaltung */
    HR,

    /** Schichtleiter: Arbeitspläne, Aufträge, Notizen */
    SHIFT_LEAD,

    /** Mitarbeiter: Check-in/out, Ferienanfragen, Rapport-Upload */
    EMPLOYEE
}
