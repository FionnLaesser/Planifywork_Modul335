package com.workforce.absence.dto;

/**
 * DTO für die Ablehnung einer Abwesenheitsanfrage durch HR (US-HR-08).
 * Bei Genehmigung ist kein Body erforderlich.
 *
 * @param reviewerId      ID der HR-Person die den Entscheid trifft
 * @param rejectionReason Optionale Begründung (nur bei Ablehnung relevant)
 */
public record ReviewRequest(Long reviewerId, String rejectionReason) {}
