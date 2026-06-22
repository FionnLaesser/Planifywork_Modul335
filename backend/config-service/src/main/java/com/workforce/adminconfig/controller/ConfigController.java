package com.workforce.adminconfig.controller;

import com.workforce.adminconfig.dto.*;
import com.workforce.adminconfig.service.ConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
public class ConfigController {

    private final ConfigService configService;

    // ── Concepts ─────────────────────────────────────────────────────────────

    @GetMapping("/concepts")
    public List<ConceptResponse> getConcepts() {
        return configService.getAllConcepts();
    }

    @PostMapping("/concepts")
    public ResponseEntity<ConceptResponse> createConcept(@RequestBody ConceptRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(configService.createConcept(req));
    }

    @PutMapping("/concepts/{id}")
    public ConceptResponse updateConcept(@PathVariable Long id, @RequestBody ConceptRequest req) {
        return configService.updateConcept(id, req);
    }

    // ── Time Rules ────────────────────────────────────────────────────────────

    @GetMapping("/time-rules")
    public List<TimeRuleResponse> getTimeRules() {
        return configService.getAllTimeRules();
    }

    @PostMapping("/time-rules")
    public ResponseEntity<TimeRuleResponse> createTimeRule(@RequestBody TimeRuleRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(configService.createTimeRule(req));
    }

    @PutMapping("/time-rules/{id}")
    public TimeRuleResponse updateTimeRule(@PathVariable Long id, @RequestBody TimeRuleRequest req) {
        return configService.updateTimeRule(id, req);
    }

    // ── Wage Rules ────────────────────────────────────────────────────────────

    @GetMapping("/wage-rules")
    public List<WageRuleResponse> getWageRules() {
        return configService.getAllWageRules();
    }

    @PostMapping("/wage-rules")
    public ResponseEntity<WageRuleResponse> createWageRule(@RequestBody WageRuleRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(configService.createWageRule(req));
    }

    @PutMapping("/wage-rules/{id}")
    public WageRuleResponse updateWageRule(@PathVariable Long id, @RequestBody WageRuleRequest req) {
        return configService.updateWageRule(id, req);
    }
}
