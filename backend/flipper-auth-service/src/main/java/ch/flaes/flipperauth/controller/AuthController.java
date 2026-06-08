package ch.flaes.flipperauth.controller;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ch.flaes.flipperauth.dto.AuthStatusResponse;
import ch.flaes.flipperauth.dto.MessageResponse;
import ch.flaes.flipperauth.dto.PendingAuthSessionResponse;
import ch.flaes.flipperauth.dto.SimulateDeviceRequest;
import ch.flaes.flipperauth.dto.StartAuthRequest;
import ch.flaes.flipperauth.dto.StartAuthResponse;
import ch.flaes.flipperauth.dto.VerifyDeviceRequest;
import ch.flaes.flipperauth.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@Validated
@RestController
@RequestMapping("/api/flipper-auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/start")
    public StartAuthResponse start(@Valid @RequestBody StartAuthRequest request) {
        return authService.start(request);
    }

    @PostMapping("/simulate-device")
    public MessageResponse simulateDevice(@Valid @RequestBody SimulateDeviceRequest request) {
        return authService.simulateDevice(request.sessionId());
    }

    @GetMapping("/status/{sessionId}")
    public AuthStatusResponse status(@PathVariable Long sessionId) {
        return authService.status(sessionId);
    }

    @GetMapping("/latest-pending")
    public PendingAuthSessionResponse latestPending(@RequestParam @NotBlank String username) {
        return authService.latestPending(username);
    }

    @PostMapping("/verify-device")
    public MessageResponse verifyDevice(@RequestBody(required = false) VerifyDeviceRequest request) {
        return authService.verifyDevicePlaceholder();
    }
}
