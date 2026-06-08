package ch.flaes.flipperauth.dto;

public record VerifyDeviceRequest(
        Long sessionId,
        String flipperId,
        String nonce,
        String signature
) {
}
