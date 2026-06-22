package com.workforce.adminconfig.service;

import com.workforce.adminconfig.dto.*;
import com.workforce.adminconfig.exception.ResourceNotFoundException;
import com.workforce.adminconfig.model.CompanyConcept;
import com.workforce.adminconfig.model.TimeRule;
import com.workforce.adminconfig.model.WageRule;
import com.workforce.adminconfig.repository.CompanyConceptRepository;
import com.workforce.adminconfig.repository.TimeRuleRepository;
import com.workforce.adminconfig.repository.WageRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConfigService {

    private final CompanyConceptRepository conceptRepo;
    private final TimeRuleRepository timeRuleRepo;
    private final WageRuleRepository wageRuleRepo;

    // ── Concepts ─────────────────────────────────────────────────────────────

    public List<ConceptResponse> getAllConcepts() {
        return conceptRepo.findAllByOrderByIdAsc().stream().map(ConceptResponse::from).toList();
    }

    public ConceptResponse createConcept(ConceptRequest req) {
        CompanyConcept c = new CompanyConcept();
        c.setName(req.name());
        c.setDescription(req.description());
        c.setActive(req.active() != null ? req.active() : true);
        return ConceptResponse.from(conceptRepo.save(c));
    }

    public ConceptResponse updateConcept(Long id, ConceptRequest req) {
        CompanyConcept c = conceptRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Konzept nicht gefunden: " + id));
        if (req.name() != null) c.setName(req.name());
        if (req.description() != null) c.setDescription(req.description());
        if (req.active() != null) c.setActive(req.active());
        return ConceptResponse.from(conceptRepo.save(c));
    }

    // ── Time Rules ────────────────────────────────────────────────────────────

    public List<TimeRuleResponse> getAllTimeRules() {
        return timeRuleRepo.findAllByOrderByIdAsc().stream().map(TimeRuleResponse::from).toList();
    }

    public TimeRuleResponse createTimeRule(TimeRuleRequest req) {
        TimeRule t = new TimeRule();
        t.setName(req.name());
        t.setMaxDailyHours(req.maxDailyHours());
        t.setMaxWeeklyHours(req.maxWeeklyHours());
        t.setBreakAfterHours(req.breakAfterHours());
        t.setBreakDurationMinutes(req.breakDurationMinutes());
        t.setActive(req.active() != null ? req.active() : true);
        return TimeRuleResponse.from(timeRuleRepo.save(t));
    }

    public TimeRuleResponse updateTimeRule(Long id, TimeRuleRequest req) {
        TimeRule t = timeRuleRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Zeitregel nicht gefunden: " + id));
        if (req.name() != null) t.setName(req.name());
        if (req.maxDailyHours() != null) t.setMaxDailyHours(req.maxDailyHours());
        if (req.maxWeeklyHours() != null) t.setMaxWeeklyHours(req.maxWeeklyHours());
        if (req.breakAfterHours() != null) t.setBreakAfterHours(req.breakAfterHours());
        if (req.breakDurationMinutes() != null) t.setBreakDurationMinutes(req.breakDurationMinutes());
        if (req.active() != null) t.setActive(req.active());
        return TimeRuleResponse.from(timeRuleRepo.save(t));
    }

    // ── Wage Rules ────────────────────────────────────────────────────────────

    public List<WageRuleResponse> getAllWageRules() {
        return wageRuleRepo.findAllByOrderByIdAsc().stream().map(WageRuleResponse::from).toList();
    }

    public WageRuleResponse createWageRule(WageRuleRequest req) {
        WageRule w = new WageRule();
        w.setName(req.name());
        w.setHourlyRate(req.hourlyRate());
        w.setOvertimeRate(req.overtimeRate());
        w.setConceptId(req.conceptId());
        w.setActive(req.active() != null ? req.active() : true);
        return WageRuleResponse.from(wageRuleRepo.save(w));
    }

    public WageRuleResponse updateWageRule(Long id, WageRuleRequest req) {
        WageRule w = wageRuleRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lohnregel nicht gefunden: " + id));
        if (req.name() != null) w.setName(req.name());
        if (req.hourlyRate() != null) w.setHourlyRate(req.hourlyRate());
        if (req.overtimeRate() != null) w.setOvertimeRate(req.overtimeRate());
        if (req.conceptId() != null) w.setConceptId(req.conceptId());
        if (req.active() != null) w.setActive(req.active());
        return WageRuleResponse.from(wageRuleRepo.save(w));
    }
}
