package ch.flaes.flipperauth.dto;

import jakarta.validation.constraints.NotNull;

public record SimulateDeviceRequest(
        @NotNull Long sessionId
) {
}
