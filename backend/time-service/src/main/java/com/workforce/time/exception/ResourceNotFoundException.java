package com.workforce.time.exception;

/**
 * Wird geworfen wenn ein angeforderter Zeiteintrag nicht gefunden wurde.
 * Führt zu einer HTTP-404-Antwort via {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {
    /** @param message Fehlerbeschreibung */
    public ResourceNotFoundException(String message) { super(message); }
}
