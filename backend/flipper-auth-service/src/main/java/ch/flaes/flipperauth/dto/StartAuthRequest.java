package ch.flaes.flipperauth.dto;

import ch.flaes.flipperauth.domain.AuthAction;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record StartAuthRequest(
        @NotBlank String username,
        @NotNull AuthAction action,
        @PositiveOrZero Integer breakMinutes
) {
}
