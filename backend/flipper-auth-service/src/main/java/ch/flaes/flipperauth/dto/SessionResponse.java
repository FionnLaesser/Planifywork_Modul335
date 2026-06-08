package ch.flaes.flipperauth.dto;

import java.time.Instant;

import ch.flaes.flipperauth.domain.AuthAction;

public record SessionResponse(
        Long id,
        String username,
        String challenge,
        AuthAction action,
        Instant expiresAt,
        boolean used,
        boolean success,
        Instant createdAt
) {
}
