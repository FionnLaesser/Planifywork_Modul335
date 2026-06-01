package com.workforce.user.controller;

import com.workforce.user.dto.CreateUserRequest;
import com.workforce.user.dto.UpdateUserRequest;
import com.workforce.user.dto.UserResponse;
import com.workforce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST-Controller für die Benutzerverwaltung.
 *
 * <p>Implementiert folgende User Stories:
 * <ul>
 *   <li>US-HR-01: Schichtleiter anlegen</li>
 *   <li>US-HR-02: Schichtleiter bearbeiten / deaktivieren</li>
 *   <li>US-HR-03: Schichtleiter-Übersicht</li>
 * </ul>
 *
 * <p>Alle Endpunkte erfordern eine gültige JWT-Authentifizierung.
 * Endpunkte zur Verwaltung sind auf die Rollen {@code HR} und {@code ADMIN} beschränkt.
 *
 * <p>Basis-URL: {@code /api/users}
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3001", "http://localhost:3002", "http://localhost:3003"})
public class UserController {

    private final UserService userService;

    /**
     * Gibt alle Benutzer zurück, optional gefiltert nach Rolle und/oder Suchbegriff.
     * US-HR-03: Schichtleiter-Übersicht ({@code ?role=SHIFT_LEAD})
     *
     * @param role   Rollenfilter (optional, z.B. "SHIFT_LEAD")
     * @param search Suchbegriff für Name (optional)
     * @return Liste der Benutzer als {@link UserResponse}
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<List<UserResponse>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(userService.getUsers(role, search));
    }

    /**
     * Gibt einen einzelnen Benutzer anhand seiner ID zurück.
     *
     * @param id Benutzer-ID im URL-Pfad
     * @return {@link UserResponse} des Benutzers
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<UserResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    /**
     * Legt einen neuen Benutzer an.
     * US-HR-01: Schichtleiter anlegen
     *
     * @param request DTO mit Benutzerdaten (Benutzername, E-Mail, Passwort, Name, Rolle)
     * @return neu erstellter Benutzer mit HTTP 201 Created
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<UserResponse> createUser(@RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    /**
     * Aktualisiert einen bestehenden Benutzer.
     * US-HR-02: Schichtleiter bearbeiten / deaktivieren
     *
     * @param id      Benutzer-ID im URL-Pfad
     * @param request DTO mit den zu ändernden Feldern
     * @return aktualisierter Benutzer
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    /**
     * Deaktiviert einen Benutzer (Soft-Delete).
     * Der Datensatz bleibt erhalten, der Login wird gesperrt.
     * US-HR-02: Schichtleiter deaktivieren
     *
     * @param id Benutzer-ID im URL-Pfad
     * @return HTTP 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<Void> deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.noContent().build();
    }
}
