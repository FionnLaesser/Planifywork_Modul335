package com.workforce.planning.controller;

import com.workforce.planning.dto.CreateHourBudgetRequest;
import com.workforce.planning.dto.CreateShiftRequest;
import com.workforce.planning.dto.CreateWorkPlanRequest;
import com.workforce.planning.dto.HourBudgetResponse;
import com.workforce.planning.dto.ShiftResponse;
import com.workforce.planning.dto.UpdateWorkPlanRequest;
import com.workforce.planning.dto.WorkPlanResponse;
import com.workforce.planning.service.PlanningService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * REST-Controller für Arbeitsplanung und Mitarbeiter-Kalender.
 *
 * <p>Basis-URL: {@code /api/planning}</p>
 */
@RestController
@RequestMapping("/api/planning")
@RequiredArgsConstructor
public class PlanningController {

    private final PlanningService planningService;


    /** Erstellt oder aktualisiert eine monatliche HR-Stundenfreigabe für einen Schichtleiter. */
    @PostMapping("/hour-budgets")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<HourBudgetResponse> saveHourBudget(@RequestBody CreateHourBudgetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(planningService.saveHourBudget(request));
    }

    /** Gibt HR-Stundenfreigaben zurück; optional gefiltert nach Schichtleiter-ID. */
    @GetMapping("/hour-budgets")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN', 'SHIFT_LEAD')")
    public ResponseEntity<List<HourBudgetResponse>> getHourBudgets(
            @RequestParam(required = false) Long shiftLeadId) {
        return ResponseEntity.ok(planningService.getHourBudgets(shiftLeadId));
    }

    /** Erstellt einen neuen Arbeitsplan mit automatisch übernommener HR-Stundenfreigabe. */
    @PostMapping("/workplans")
    @PreAuthorize("hasAnyRole('SHIFT_LEAD', 'HR', 'ADMIN')")
    public ResponseEntity<WorkPlanResponse> createWorkPlan(@RequestBody CreateWorkPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(planningService.createWorkPlan(request));
    }

    /** Gibt Arbeitspläne zurück; optional gefiltert nach Schichtleiter-ID. */
    @GetMapping("/workplans")
    @PreAuthorize("hasAnyRole('SHIFT_LEAD', 'HR', 'ADMIN')")
    public ResponseEntity<List<WorkPlanResponse>> getWorkPlans(
            @RequestParam(required = false) Long shiftLeadId) {
        return ResponseEntity.ok(planningService.getWorkPlans(shiftLeadId));
    }

    /** Gibt einen Arbeitsplan inklusive Schichten und Stundenübersicht zurück. */
    @GetMapping("/workplans/{id}")
    @PreAuthorize("hasAnyRole('SHIFT_LEAD', 'HR', 'ADMIN')")
    public ResponseEntity<WorkPlanResponse> getWorkPlan(@PathVariable Long id) {
        return ResponseEntity.ok(planningService.getWorkPlan(id));
    }

    /** Bearbeitet einen Arbeitsplan-Entwurf. */
    @PutMapping("/workplans/{id}")
    @PreAuthorize("hasAnyRole('SHIFT_LEAD', 'HR', 'ADMIN')")
    public ResponseEntity<WorkPlanResponse> updateWorkPlan(
            @PathVariable Long id,
            @RequestBody UpdateWorkPlanRequest request) {
        return ResponseEntity.ok(planningService.updateWorkPlan(id, request));
    }

    /** Fügt einem Arbeitsplan eine Schicht hinzu und berechnet die Stundenübersicht neu. */
    @PostMapping("/workplans/{id}/shifts")
    @PreAuthorize("hasAnyRole('SHIFT_LEAD', 'HR', 'ADMIN')")
    public ResponseEntity<WorkPlanResponse> addShift(
            @PathVariable Long id,
            @RequestBody CreateShiftRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(planningService.addShift(id, request));
    }

    /** Veröffentlicht den Arbeitsplan, damit Mitarbeiter ihre Schichten im Mobile-Kalender sehen. */
    @PutMapping("/workplans/{id}/publish")
    @PreAuthorize("hasAnyRole('SHIFT_LEAD', 'HR', 'ADMIN')")
    public ResponseEntity<WorkPlanResponse> publishWorkPlan(@PathVariable Long id) {
        return ResponseEntity.ok(planningService.publishWorkPlan(id));
    }

    /** Gibt veröffentlichte Kalenderschichten eines Mitarbeiters zurück. */
    @GetMapping("/calendar/{employeeId}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'SHIFT_LEAD', 'HR', 'ADMIN')")
    public ResponseEntity<List<ShiftResponse>> getEmployeeCalendar(
            @PathVariable Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(planningService.getEmployeeCalendar(employeeId, from, to));
    }
}
