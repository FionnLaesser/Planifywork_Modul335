package ch.flaes.flipperauth.dto;

import java.time.Instant;

import ch.flaes.flipperauth.domain.AuthAction;

public record StartAuthResponse(
        Long sessionId,
        String challenge,
        AuthAction action,
        Instant expiresAt
) {
}
