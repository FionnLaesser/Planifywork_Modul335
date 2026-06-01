package com.workforce.user.dto;

/**
 * DTO für das Bearbeiten eines bestehenden Benutzers (US-HR-02).
 * Alle Felder sind optional – nur nicht-null Werte werden aktualisiert.
 *
 * @param firstName Neuer Vorname (optional)
 * @param lastName  Neuer Nachname (optional)
 * @param email     Neue E-Mail-Adresse (optional)
 * @param active    Aktivierungsstatus – {@code false} deaktiviert den Benutzer
 * @param roleName  Neuer Rollenname (optional, z.B. "ADMIN", "HR", "SHIFT_LEAD", "EMPLOYEE")
 */
public record UpdateUserRequest(
        String firstName,
        String lastName,
        String email,
        Boolean active,
        String roleName
) {}
