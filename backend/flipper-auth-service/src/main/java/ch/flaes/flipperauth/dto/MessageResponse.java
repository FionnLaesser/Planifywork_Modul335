package ch.flaes.flipperauth.dto;

public record MessageResponse(
        boolean success,
        String message
) {
}
