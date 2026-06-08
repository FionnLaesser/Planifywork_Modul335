package ch.flaes.flipperauth.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.flaes.flipperauth.dto.SessionResponse;
import ch.flaes.flipperauth.dto.UserResponse;
import ch.flaes.flipperauth.service.AuthService;

@RestController
@RequestMapping("/api/flipper-auth/admin")
public class AdminController {

    private final AuthService authService;

    public AdminController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/users")
    public List<UserResponse> users() {
        return authService.users();
    }

    @GetMapping("/sessions")
    public List<SessionResponse> sessions() {
        return authService.sessions();
    }
}
