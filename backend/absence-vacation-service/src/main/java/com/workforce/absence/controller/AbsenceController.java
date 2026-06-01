package com.workforce.absence.controller;

import com.workforce.absence.dto.AbsenceResponse;
import com.workforce.absence.dto.CreateAbsenceRequest;
import com.workforce.absence.dto.ReviewRequest;
import com.workforce.absence.service.AbsenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST-Controller für die Verwaltung von Abwesenheiten und Ferienanfragen.
 *
 * <p>Implementiert folgende User Stories:
 * <ul>
 *   <li>US-HR-08: {@code GET /api/absences/pending}, {@code PUT .../approve}, {@code PUT .../reject}</li>
 *   <li>US-HR-09: {@code GET /api/absences}, {@code POST /api/absences}, {@code DELETE ./:id}</li>
 *   <li>US-HR-10: {@code GET /api/absences} mit Monatsfilter für Kalenderansicht</li>
 * </ul>
 *
 * <p>Basis-URL: {@code /api/absences}
 */
@RestController
@RequestMapping("/api/absences")
@RequiredArgsConstructor
public class AbsenceController {

    private final AbsenceService absenceService;

    /**
     * Gibt alle Abwesenheiten zurück, optional gefiltert nach Mitarbeiter und Typ.
     * US-HR-09: Absenzen verwalten | US-HR-10: Daten für Kalenderansicht.
     *
     * @param employeeId Filter nach Mitarbeiter-ID (optional)
     * @param type       Filter nach Typ (VACATION, SICK, OTHER) (optional)
     * @return gefilterte Liste der Abwesenheiten
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'SHIFT_LEAD')")
    public ResponseEntity<List<AbsenceResponse>> getAll(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(absenceService.getAll(employeeId, type));
    }

    /**
     * Gibt alle offenen (PENDING) Abwesenheitsanfragen zurück.
     * US-HR-08: Offene Ferienanfragen für HR.
     *
     * @return Liste der pendenten Anfragen
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<List<AbsenceResponse>> getPending() {
        return ResponseEntity.ok(absenceService.getPending());
    }

    /**
     * Gibt eine einzelne Abwesenheit anhand ihrer ID zurück.
     *
     * @param id Abwesenheits-ID im URL-Pfad
     * @return {@link AbsenceResponse}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'EMPLOYEE')")
    public ResponseEntity<AbsenceResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(absenceService.getById(id));
    }

    /**
     * Erstellt eine neue Abwesenheitsanfrage.
     * US-HR-09: Manuelle Erfassung durch HR | Flutter App: Selbsterfassung.
     *
     * @param request DTO mit Mitarbeiter, Typ, Zeitraum und Begründung
     * @return neu erstellte Abwesenheit mit HTTP 201 Created
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'EMPLOYEE')")
    public ResponseEntity<AbsenceResponse> create(@RequestBody CreateAbsenceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(absenceService.create(request));
    }

    /**
     * Genehmigt eine Abwesenheitsanfrage.
     * US-HR-08: Ferienanfragen genehmigen.
     *
     * @param id      ID der Anfrage im URL-Pfad
     * @param request DTO mit Reviewer-ID
     * @return aktualisierte Abwesenheit mit Status APPROVED
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<AbsenceResponse> approve(
            @PathVariable Long id,
            @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(absenceService.approve(id, request));
    }

    /**
     * Lehnt eine Abwesenheitsanfrage ab.
     * US-HR-08: Ferienanfragen ablehnen.
     *
     * @param id      ID der Anfrage im URL-Pfad
     * @param request DTO mit Reviewer-ID und Ablehnungsbegründung
     * @return aktualisierte Abwesenheit mit Status REJECTED
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<AbsenceResponse> reject(
            @PathVariable Long id,
            @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(absenceService.reject(id, request));
    }

    /**
     * Löscht eine Abwesenheit dauerhaft.
     * US-HR-09: Absenzen löschen (nur HR / Admin).
     *
     * @param id ID der zu löschenden Abwesenheit
     * @return HTTP 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        absenceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
