package com.workforce.user.dto;

/**
 * DTO für das Anlegen eines neuen Benutzers (US-HR-01).
 *
 * @param username  Gewünschter Benutzername (muss eindeutig sein)
 * @param email     E-Mail-Adresse (muss eindeutig sein)
 * @param password  Initiales Passwort (wird BCrypt-gehasht gespeichert)
 * @param firstName Vorname
 * @param lastName  Nachname
 * @param roleName  Name der zuzuweisenden Rolle (z.B. "SHIFT_LEAD")
 */
public record CreateUserRequest(
        String username,
        String email,
        String password,
        String firstName,
        String lastName,
        String roleName
) {}
