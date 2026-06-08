package ch.flaes.flipperauth.dto;

public record UserResponse(
        Long id,
        String username,
        boolean loggedIn
) {
}
