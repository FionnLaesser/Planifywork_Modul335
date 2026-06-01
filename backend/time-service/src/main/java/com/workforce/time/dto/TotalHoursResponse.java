package com.workforce.time.dto;

import java.math.BigDecimal;

/**
 * DTO für die Gesamtstunden-Übersicht eines Mitarbeiters (US-HR-04).
 *
 * @param employeeId ID des Mitarbeiters
 * @param totalHours Summe der geleisteten Stunden im gewählten Zeitraum
 */
public record TotalHoursResponse(Long employeeId, BigDecimal totalHours) {}
