package com.workforce.planning.service;

import com.workforce.planning.dto.CreateHourBudgetRequest;
import com.workforce.planning.dto.CreateShiftRequest;
import com.workforce.planning.dto.CreateWorkPlanRequest;
import com.workforce.planning.dto.HourBudgetResponse;
import com.workforce.planning.dto.ShiftResponse;
import com.workforce.planning.dto.UpdateWorkPlanRequest;
import com.workforce.planning.dto.WorkPlanResponse;
import com.workforce.planning.exception.ResourceNotFoundException;
import com.workforce.planning.model.HourBudget;
import com.workforce.planning.model.Shift;
import com.workforce.planning.model.WorkPlan;
import com.workforce.planning.model.WorkPlanStatus;
import com.workforce.planning.repository.HourBudgetRepository;
import com.workforce.planning.repository.ShiftRepository;
import com.workforce.planning.repository.WorkPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

/**
 * Service-Klasse für Arbeitspläne, Schichten und HR-Stundenfreigaben.
 *
 * <p>HR erstellt zuerst ein Monatskontingent. Schichtleiter erstellen danach Arbeitspläne,
 * die automatisch dieses freigegebene Kontingent übernehmen. Dadurch kann der Schichtleiter
 * nicht mehr selbst bestimmen, wie viele Stunden freigegeben sind.</p>
 */
@Service
@RequiredArgsConstructor
public class PlanningService {

    private static final BigDecimal UNDER_PLANNED_FACTOR = BigDecimal.valueOf(0.95);

    private final WorkPlanRepository workPlanRepository;
    private final ShiftRepository shiftRepository;
    private final HourBudgetRepository hourBudgetRepository;

    /** Erstellt oder aktualisiert eine HR-Stundenfreigabe für einen Schichtleiter und Monat. */
    @Transactional
    public HourBudgetResponse saveHourBudget(CreateHourBudgetRequest request) {
        validateHourBudgetRequest(request);

        HourBudget budget = hourBudgetRepository
                .findByShiftLeadIdAndYearAndMonth(request.shiftLeadId(), request.year(), request.month())
                .orElseGet(HourBudget::new);

        budget.setShiftLeadId(request.shiftLeadId());
        budget.setYear(request.year());
        budget.setMonth(request.month());
        budget.setApprovedHours(normalizeHours(request.approvedHours()));
        budget.setCreatedBy(request.createdBy());
        budget.setNotes(normalizeText(request.notes()));

        return HourBudgetResponse.from(hourBudgetRepository.save(budget));
    }

    /** Gibt HR-Stundenfreigaben zurück; optional gefiltert nach Schichtleiter. */
    @Transactional(readOnly = true)
    public List<HourBudgetResponse> getHourBudgets(Long shiftLeadId) {
        List<HourBudget> budgets = shiftLeadId != null
                ? hourBudgetRepository.findByShiftLeadIdOrderByYearDescMonthDesc(shiftLeadId)
                : hourBudgetRepository.findAllByOrderByYearDescMonthDescShiftLeadIdAsc();

        return budgets.stream().map(HourBudgetResponse::from).toList();
    }

    /** Erstellt einen neuen Arbeitsplan und übernimmt das HR-Stundenkontingent automatisch. */
    @Transactional
    public WorkPlanResponse createWorkPlan(CreateWorkPlanRequest request) {
        validateCreateWorkPlanRequest(request);
        HourBudget budget = findMatchingBudget(request.shiftLeadId(), request.startDate(), request.endDate());

        WorkPlan workPlan = new WorkPlan();
        workPlan.setTitle(request.title().trim());
        workPlan.setShiftLeadId(request.shiftLeadId());
        workPlan.setHourBudgetId(budget.getId());
        workPlan.setStartDate(request.startDate());
        workPlan.setEndDate(request.endDate());
        workPlan.setApprovedHours(normalizeHours(budget.getApprovedHours()));
        workPlan.setStatus(WorkPlanStatus.DRAFT);

        WorkPlan saved = workPlanRepository.save(workPlan);
        return toResponse(saved);
    }

    /** Gibt alle Arbeitspläne zurück, optional gefiltert nach Schichtleiter. */
    @Transactional(readOnly = true)
    public List<WorkPlanResponse> getWorkPlans(Long shiftLeadId) {
        List<WorkPlan> workPlans = shiftLeadId != null
                ? workPlanRepository.findByShiftLeadIdOrderByStartDateDesc(shiftLeadId)
                : workPlanRepository.findAllByOrderByStartDateDesc();

        return workPlans.stream().map(this::toResponse).toList();
    }

    /** Gibt einen Arbeitsplan inklusive Schichten und Stundenübersicht zurück. */
    @Transactional(readOnly = true)
    public WorkPlanResponse getWorkPlan(Long id) {
        WorkPlan workPlan = findWorkPlan(id);
        return toResponse(workPlan);
    }

    /** Bearbeitet Metadaten eines Arbeitsplan-Entwurfs und übernimmt erneut das passende HR-Kontingent. */
    @Transactional
    public WorkPlanResponse updateWorkPlan(Long workPlanId, UpdateWorkPlanRequest request) {
        WorkPlan workPlan = findWorkPlan(workPlanId);
        ensureDraft(workPlan);
        validateUpdateWorkPlanRequest(request);
        HourBudget budget = findMatchingBudget(workPlan.getShiftLeadId(), request.startDate(), request.endDate());

        workPlan.setTitle(request.title().trim());
        workPlan.setStartDate(request.startDate());
        workPlan.setEndDate(request.endDate());
        workPlan.setHourBudgetId(budget.getId());
        workPlan.setApprovedHours(normalizeHours(budget.getApprovedHours()));

        validateExistingShiftsStillFit(workPlan);
        return toResponse(workPlanRepository.save(workPlan));
    }

    /** Fügt einem Arbeitsplan eine neue Schicht hinzu. */
    @Transactional
    public WorkPlanResponse addShift(Long workPlanId, CreateShiftRequest request) {
        WorkPlan workPlan = findWorkPlan(workPlanId);
        ensureDraft(workPlan);
        validateCreateShiftRequest(workPlan, request);
        validateNoOverlap(request);

        Shift shift = new Shift();
        shift.setWorkPlan(workPlan);
        shift.setEmployeeId(request.employeeId());
        shift.setOrderId(request.orderId());
        shift.setShiftDate(request.shiftDate());
        shift.setStartTime(request.startTime());
        shift.setEndTime(request.endTime());
        shift.setNotes(normalizeText(request.notes()));

        shiftRepository.save(shift);
        return toResponse(workPlan);
    }

    /** Veröffentlicht einen Arbeitsplan, damit Mitarbeiter ihn im Kalender sehen. */
    @Transactional
    public WorkPlanResponse publishWorkPlan(Long workPlanId) {
        WorkPlan workPlan = findWorkPlan(workPlanId);
        List<Shift> shifts = shiftRepository.findByWorkPlanIdOrderByShiftDateAscStartTimeAsc(workPlanId);

        if (shifts.isEmpty()) {
            throw new IllegalStateException("Arbeitsplan kann ohne Schichten nicht veröffentlicht werden");
        }

        workPlan.setStatus(WorkPlanStatus.PUBLISHED);
        workPlan.setPublishedAt(LocalDateTime.now());
        WorkPlan saved = workPlanRepository.save(workPlan);

        return toResponse(saved);
    }

    /** Gibt veröffentlichte Kalenderschichten eines Mitarbeiters zurück. */
    @Transactional(readOnly = true)
    public List<ShiftResponse> getEmployeeCalendar(Long employeeId, LocalDate from, LocalDate to) {
        if (employeeId == null) {
            throw new IllegalArgumentException("employeeId ist erforderlich");
        }

        YearMonth currentMonth = YearMonth.now();
        LocalDate effectiveFrom = from != null ? from : currentMonth.atDay(1);
        LocalDate effectiveTo = to != null ? to : currentMonth.atEndOfMonth();

        if (effectiveTo.isBefore(effectiveFrom)) {
            throw new IllegalArgumentException("to darf nicht vor from liegen");
        }

        return shiftRepository
                .findCalendarShifts(employeeId, effectiveFrom, effectiveTo, WorkPlanStatus.PUBLISHED)
                .stream()
                .map(shift -> ShiftResponse.from(shift, calculateShiftHours(shift)))
                .toList();
    }

    private WorkPlan findWorkPlan(Long id) {
        return workPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Arbeitsplan mit ID " + id + " nicht gefunden"));
    }

    private HourBudget findMatchingBudget(Long shiftLeadId, LocalDate startDate, LocalDate endDate) {
        YearMonth period = validateMonthlyPeriod(startDate, endDate);
        return hourBudgetRepository
                .findByShiftLeadIdAndYearAndMonth(shiftLeadId, period.getYear(), period.getMonthValue())
                .orElseThrow(() -> new IllegalStateException(
                        "Kein HR-Stundenkontingent für Schichtleiter " + shiftLeadId + " und Monat " + period + " freigegeben"));
    }

    private YearMonth validateMonthlyPeriod(LocalDate startDate, LocalDate endDate) {
        YearMonth startMonth = YearMonth.from(startDate);
        YearMonth endMonth = YearMonth.from(endDate);
        if (!startMonth.equals(endMonth)) {
            throw new IllegalArgumentException("Arbeitspläne müssen innerhalb eines freigegebenen Monats liegen");
        }
        return startMonth;
    }

    private WorkPlanResponse toResponse(WorkPlan workPlan) {
        List<Shift> shifts = shiftRepository.findByWorkPlanIdOrderByShiftDateAscStartTimeAsc(workPlan.getId());
        List<ShiftResponse> shiftResponses = shifts.stream()
                .map(shift -> ShiftResponse.from(shift, calculateShiftHours(shift)))
                .toList();

        BigDecimal plannedHours = shiftResponses.stream()
                .map(ShiftResponse::plannedHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal approvedHours = normalizeHours(workPlan.getApprovedHours());
        BigDecimal remainingHours = approvedHours.subtract(plannedHours).setScale(2, RoundingMode.HALF_UP);
        boolean overLimit = approvedHours.compareTo(BigDecimal.ZERO) > 0 && plannedHours.compareTo(approvedHours) > 0;
        boolean underPlanned = approvedHours.compareTo(BigDecimal.ZERO) > 0
                && plannedHours.compareTo(approvedHours.multiply(UNDER_PLANNED_FACTOR)) < 0;

        return WorkPlanResponse.from(
                workPlan,
                plannedHours,
                remainingHours,
                overLimit,
                underPlanned,
                shiftResponses
        );
    }

    private BigDecimal calculateShiftHours(Shift shift) {
        long minutes = Duration.between(shift.getStartTime(), shift.getEndTime()).toMinutes();
        if (minutes <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private void validateHourBudgetRequest(CreateHourBudgetRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request darf nicht leer sein");
        }
        if (request.shiftLeadId() == null) {
            throw new IllegalArgumentException("shiftLeadId ist erforderlich");
        }
        if (request.year() == null || request.year() < 2000) {
            throw new IllegalArgumentException("year ist erforderlich und muss gültig sein");
        }
        if (request.month() == null || request.month() < 1 || request.month() > 12) {
            throw new IllegalArgumentException("month muss zwischen 1 und 12 liegen");
        }
        if (request.approvedHours() == null || request.approvedHours().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("approvedHours ist erforderlich und darf nicht negativ sein");
        }
    }

    private void validateCreateWorkPlanRequest(CreateWorkPlanRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request darf nicht leer sein");
        }
        if (request.shiftLeadId() == null) {
            throw new IllegalArgumentException("shiftLeadId ist erforderlich");
        }
        validateWorkPlanFields(request.title(), request.startDate(), request.endDate());
    }

    private void validateUpdateWorkPlanRequest(UpdateWorkPlanRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request darf nicht leer sein");
        }
        validateWorkPlanFields(request.title(), request.startDate(), request.endDate());
    }

    private void validateWorkPlanFields(String title, LocalDate startDate, LocalDate endDate) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Titel ist erforderlich");
        }
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("startDate und endDate sind erforderlich");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("endDate darf nicht vor startDate liegen");
        }
    }

    private void validateCreateShiftRequest(WorkPlan workPlan, CreateShiftRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request darf nicht leer sein");
        }
        if (request.employeeId() == null) {
            throw new IllegalArgumentException("employeeId ist erforderlich");
        }
        if (request.shiftDate() == null) {
            throw new IllegalArgumentException("shiftDate ist erforderlich");
        }
        if (request.startTime() == null || request.endTime() == null) {
            throw new IllegalArgumentException("startTime und endTime sind erforderlich");
        }
        if (!request.startTime().isBefore(request.endTime())) {
            throw new IllegalArgumentException("startTime muss vor endTime liegen");
        }
        if (request.shiftDate().isBefore(workPlan.getStartDate()) || request.shiftDate().isAfter(workPlan.getEndDate())) {
            throw new IllegalArgumentException("Schichtdatum liegt ausserhalb des Arbeitsplans");
        }
    }

    private void validateNoOverlap(CreateShiftRequest request) {
        boolean overlaps = shiftRepository
                .findByEmployeeIdAndShiftDateOrderByStartTimeAsc(request.employeeId(), request.shiftDate())
                .stream()
                .anyMatch(existing -> request.startTime().isBefore(existing.getEndTime())
                        && request.endTime().isAfter(existing.getStartTime()));

        if (overlaps) {
            throw new IllegalStateException("Mitarbeiter ist in diesem Zeitraum bereits eingeplant");
        }
    }

    private void validateExistingShiftsStillFit(WorkPlan workPlan) {
        boolean anyShiftOutsidePeriod = shiftRepository.findByWorkPlanIdOrderByShiftDateAscStartTimeAsc(workPlan.getId())
                .stream()
                .anyMatch(shift -> shift.getShiftDate().isBefore(workPlan.getStartDate())
                        || shift.getShiftDate().isAfter(workPlan.getEndDate()));

        if (anyShiftOutsidePeriod) {
            throw new IllegalStateException("Bestehende Schichten liegen ausserhalb des neuen Planungszeitraums");
        }
    }

    private void ensureDraft(WorkPlan workPlan) {
        if (workPlan.getStatus() == WorkPlanStatus.PUBLISHED) {
            throw new IllegalStateException("Veröffentlichte Arbeitspläne können nicht mehr bearbeitet werden");
        }
    }

    private BigDecimal normalizeHours(BigDecimal hours) {
        return hours == null
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : hours.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeText(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }
}
