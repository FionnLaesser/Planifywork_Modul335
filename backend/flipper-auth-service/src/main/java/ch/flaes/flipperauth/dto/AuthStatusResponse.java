package ch.flaes.flipperauth.dto;

import ch.flaes.flipperauth.domain.AuthAction;

public record AuthStatusResponse(
        Long sessionId,
        String username,
        AuthAction action,
        boolean used,
        boolean success,
        boolean loggedIn
) {
}
