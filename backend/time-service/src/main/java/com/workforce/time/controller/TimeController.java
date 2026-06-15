package com.workforce.time.controller;

import com.workforce.time.dto.*;
import com.workforce.time.service.TimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

/**
 * REST-Controller für die Arbeitszeiterfassung und -auswertung.
 *
 * <p>Implementiert folgende User Stories:
 * <ul>
 *   <li>US-HR-04: {@code GET /api/time/total} – Gesamtstunden aller Mitarbeiter</li>
 *   <li>US-HR-05: {@code GET /api/time/month/:id} – Monatsdetail pro Mitarbeiter</li>
 * </ul>
 *
 * <p>Basis-URL: {@code /api/time}
 */
@RestController
@RequestMapping("/api/time")
@RequiredArgsConstructor
public class TimeController {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Europe/Zurich");

    private final TimeService timeService;

    /**
     * Gibt die Gesamtstunden aller Mitarbeiter in einem Datumsbereich zurück.
     * US-HR-04: Gesamtstunden-Übersicht für HR.
     *
     * @param from Startdatum (ISO-Format, z.B. 2025-01-01), Standard: Monatsanfang
     * @param to   Enddatum (ISO-Format), Standard: heute
     * @return Liste mit Mitarbeiter-ID und Gesamtstunden
     */
    @GetMapping("/total")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'SHIFT_LEAD')")
    public ResponseEntity<List<TotalHoursResponse>> getTotalHours(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        LocalDate start = from != null ? from : today.withDayOfMonth(1);
        LocalDate end   = to   != null ? to   : today;

        return ResponseEntity.ok(timeService.getTotalHours(start, end));
    }

    /**
     * Gibt die Gesamtstunden eines einzelnen Mitarbeiters in einem Datumsbereich zurück.
     * Wird vom Schichtleiter-Web und optionalen Detailansichten verwendet.
     *
     * @param employeeId ID des Mitarbeiters
     * @param from Startdatum (ISO-Format), Standard: Monatsanfang
     * @param to   Enddatum (ISO-Format), Standard: heute
     * @return Mitarbeiter-ID mit Gesamtstunden im gewählten Zeitraum
     */
    @GetMapping("/total/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'SHIFT_LEAD')")
    public ResponseEntity<TotalHoursResponse> getTotalHoursForEmployee(
            @PathVariable Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        LocalDate start = from != null ? from : today.withDayOfMonth(1);
        LocalDate end   = to   != null ? to   : today;

        return ResponseEntity.ok(timeService.getTotalHoursForEmployee(employeeId, start, end));
    }

    /**
     * Gibt alle Zeiteinträge eines Mitarbeiters für einen bestimmten Monat zurück.
     * US-HR-05: Detaillierte Stundenauswertung pro Mitarbeiter.
     *
     * @param employeeId ID des Mitarbeiters
     * @param month      Monat 1–12 (Standard: aktueller Monat)
     * @param year       Jahr (Standard: aktuelles Jahr)
     * @return Liste der Tageseinträge
     */
    @GetMapping("/month/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'SHIFT_LEAD')")
    public ResponseEntity<List<TimeEntryResponse>> getMonthlyEntries(
            @PathVariable Long employeeId,
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year) {

        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        int m = month > 0 ? month : today.getMonthValue();
        int y = year  > 0 ? year  : today.getYear();

        return ResponseEntity.ok(timeService.getMonthlyEntries(employeeId, m, y));
    }

    @GetMapping("/current/{employeeId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SHIFT_LEAD', 'HR', 'ADMIN')")
    public ResponseEntity<TimeEntryResponse> getCurrentEntry(@PathVariable Long employeeId) {
        Optional<TimeEntryResponse> entry = timeService.getCurrentEntry(employeeId);
        return entry.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * Alias für den heutigen Zeiteintrag eines Mitarbeiters.
     * Dokumentiert als {@code GET /api/time/today/{employeeId}} und kompatibel zu Mobile/Frontend.
     */
    @GetMapping("/today/{employeeId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SHIFT_LEAD', 'HR', 'ADMIN')")
    public ResponseEntity<TimeEntryResponse> getTodayEntry(@PathVariable Long employeeId) {
        Optional<TimeEntryResponse> entry = timeService.getTodayEntry(employeeId);
        return entry.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/latest/{employeeId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SHIFT_LEAD', 'HR', 'ADMIN')")
    public ResponseEntity<TimeEntryResponse> getLatestEntry(@PathVariable Long employeeId) {
        Optional<TimeEntryResponse> entry = timeService.getLatestEntry(employeeId);
        return entry.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * Erfasst einen Check-in für einen Mitarbeiter.
     * Wird von der Flutter Mobile App aufgerufen.
     *
     * @param request DTO mit Mitarbeiter-ID
     * @return erstellter Zeiteintrag
     */
    @PostMapping("/checkin")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SHIFT_LEAD')")
    public ResponseEntity<TimeEntryResponse> checkIn(@RequestBody CheckInRequest request) {
        return ResponseEntity.ok(timeService.checkIn(request));
    }

    /**
     * Erfasst einen Check-out für einen Mitarbeiter.
     * Berechnet automatisch die Netto-Arbeitsstunden.
     * Wird von der Flutter Mobile App aufgerufen.
     *
     * @param request DTO mit Mitarbeiter-ID und Pausenzeit
     * @return aktualisierter Zeiteintrag mit berechneten Stunden
     */
    @PostMapping("/checkout")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SHIFT_LEAD')")
    public ResponseEntity<TimeEntryResponse> checkOut(@RequestBody CheckOutRequest request) {
        return ResponseEntity.ok(timeService.checkOut(request));
    }
}
