package com.workforce.user.dto;

/**
 * DTO für das Bearbeiten eines bestehenden Benutzers (US-HR-02).
 * Alle Felder sind optional – nur nicht-null Werte werden aktualisiert.
 *
 * @param firstName Neuer Vorname (optional)
 * @param lastName  Neuer Nachname (optional)
 * @param email     Neue E-Mail-Adresse (optional)
 * @param active    Aktivierungsstatus – {@code false} deaktiviert den Benutzer
 */
public record UpdateUserRequest(
        String firstName,
        String lastName,
        String email,
        Boolean active
) {}
