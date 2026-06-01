package com.workforce.time.dto;

/**
 * DTO für einen Check-in Request eines Mitarbeiters.
 *
 * @param employeeId ID des eincheckenden Mitarbeiters
 */
public record CheckInRequest(Long employeeId) {}
