package ch.flaes.flipperauth.dto;

import ch.flaes.flipperauth.domain.AuthAction;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StartAuthRequest(
        @NotBlank String username,
        @NotNull AuthAction action
) {
}
