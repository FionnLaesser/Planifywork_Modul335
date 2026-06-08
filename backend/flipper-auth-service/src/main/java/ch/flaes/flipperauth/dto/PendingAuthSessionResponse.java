package ch.flaes.flipperauth.dto;

import java.time.Instant;

import ch.flaes.flipperauth.domain.AuthAction;

public record PendingAuthSessionResponse(
        Long sessionId,
        String username,
        AuthAction action,
        String challenge,
        Instant expiresAt
) {
}
