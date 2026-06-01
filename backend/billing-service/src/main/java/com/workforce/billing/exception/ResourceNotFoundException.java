package com.workforce.billing.exception;

/**
 * Wird geworfen wenn eine angeforderte Rechnung nicht gefunden wurde.
 * Führt zu einer HTTP-404-Antwort via {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {
    /** @param message Fehlerbeschreibung */
    public ResourceNotFoundException(String message) { super(message); }
}
