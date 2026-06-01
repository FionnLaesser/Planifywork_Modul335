package com.workforce.time.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;

/** Globaler Fehlerbehandler für den Time Service. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** HTTP 404 für nicht gefundene Zeiteinträge. */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", LocalDateTime.now().toString(), "status", 404,
                "error", "Not Found", "message", ex.getMessage()));
    }

    /** HTTP 400 für ungültige Anfragen (z.B. doppelter Check-in). */
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, Object>> handleBadRequest(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", LocalDateTime.now().toString(), "status", 400,
                "error", "Bad Request", "message", ex.getMessage()));
    }

    /** HTTP 500 für alle anderen Fehler. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "timestamp", LocalDateTime.now().toString(), "status", 500,
                "error", "Internal Server Error", "message", ex.getMessage()));
    }
}
