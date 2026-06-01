package com.workforce.user.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Globaler Fehlerbehandler für alle Controller im User &amp; Role Service.
 * Fängt bekannte Ausnahmen ab und gibt strukturierte JSON-Fehlermeldungen zurück.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Behandelt {@link ResourceNotFoundException} und gibt HTTP 404 zurück.
     *
     * @param ex die Ausnahme
     * @return strukturierte Fehlerantwort mit Zeitstempel und Meldung
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", 404,
                "error", "Not Found",
                "message", ex.getMessage()
        ));
    }

    /**
     * Behandelt {@link IllegalArgumentException} und gibt HTTP 400 zurück.
     *
     * @param ex die Ausnahme
     * @return strukturierte Fehlerantwort
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", 400,
                "error", "Bad Request",
                "message", ex.getMessage()
        ));
    }

    /**
     * Fängt alle anderen unbehandelten Ausnahmen ab und gibt HTTP 500 zurück.
     *
     * @param ex die Ausnahme
     * @return generische Fehlerantwort
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", 500,
                "error", "Internal Server Error",
                "message", ex.getMessage()
        ));
    }
}
