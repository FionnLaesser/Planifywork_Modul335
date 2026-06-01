package com.workforce.user.exception;

/**
 * Wird geworfen wenn eine angeforderte Ressource (z.B. Benutzer oder Rolle)
 * in der Datenbank nicht gefunden wurde.
 * Führt zu einer HTTP-404-Antwort via {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Erstellt eine neue {@code ResourceNotFoundException} mit der gegebenen Meldung.
     *
     * @param message Fehlerbeschreibung
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
