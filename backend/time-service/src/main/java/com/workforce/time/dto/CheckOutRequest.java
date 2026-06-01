package com.workforce.time.dto;

/**
 * DTO für einen Check-out Request eines Mitarbeiters.
 *
 * @param employeeId   ID des auscheckenden Mitarbeiters
 * @param breakMinutes Pausendauer in Minuten (mind. 0)
 */
public record CheckOutRequest(Long employeeId, Integer breakMinutes) {}
