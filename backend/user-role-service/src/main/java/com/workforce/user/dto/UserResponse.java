package com.workforce.user.dto;

import com.workforce.user.model.User;

import java.time.LocalDateTime;

/**
 * DTO für die Rückgabe von Benutzerdaten an das Frontend.
 * Das Passwort-Feld wird bewusst nicht übertragen.
 *
 * @param id        Eindeutige Benutzer-ID
 * @param username  Benutzername
 * @param email     E-Mail-Adresse
 * @param firstName Vorname
 * @param lastName  Nachname
 * @param roleName  Name der zugewiesenen Rolle
 * @param active    Aktivierungsstatus
 * @param createdAt Erstellungszeitpunkt
 */
public record UserResponse(
        Long id,
        String username,
        String email,
        String firstName,
        String lastName,
        String roleName,
        boolean active,
        LocalDateTime createdAt
) {
    /**
     * Factory-Methode: erstellt einen {@link UserResponse} aus einer {@link User}-Entity.
     *
     * @param user die User-Entity
     * @return gemapptes DTO
     */
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().getName(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
