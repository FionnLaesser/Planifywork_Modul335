package ch.flaes.flipperauth.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ch.flaes.flipperauth.domain.AuthAction;
import ch.flaes.flipperauth.domain.AuthSessionEntity;
import ch.flaes.flipperauth.domain.UserEntity;
import ch.flaes.flipperauth.dto.AuthStatusResponse;
import ch.flaes.flipperauth.dto.MessageResponse;
import ch.flaes.flipperauth.dto.PendingAuthSessionResponse;
import ch.flaes.flipperauth.dto.SessionResponse;
import ch.flaes.flipperauth.dto.StartAuthRequest;
import ch.flaes.flipperauth.dto.StartAuthResponse;
import ch.flaes.flipperauth.dto.UserResponse;
import ch.flaes.flipperauth.repository.AuthSessionRepository;
import ch.flaes.flipperauth.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final AuthSessionRepository authSessionRepository;
    private final TimeTrackingService timeTrackingService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            AuthSessionRepository authSessionRepository,
            TimeTrackingService timeTrackingService) {
        this.userRepository = userRepository;
        this.authSessionRepository = authSessionRepository;
        this.timeTrackingService = timeTrackingService;
    }

    @Transactional
    public StartAuthResponse start(StartAuthRequest request) {
        UserEntity user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        AuthSessionEntity session = new AuthSessionEntity(
                user,
                createChallenge(),
                request.action(),
                Instant.now().plusSeconds(60)
        );
        session.setBreakMinutes(request.breakMinutes() == null ? 0 : request.breakMinutes());
        AuthSessionEntity saved = authSessionRepository.save(session);

        return new StartAuthResponse(saved.getId(), saved.getChallenge(), saved.getAction(), saved.getExpiresAt());
    }

    @Transactional
    public MessageResponse simulateDevice(Long sessionId) {
        AuthSessionEntity session = getSession(sessionId);

        if (session.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session is already used");
        }
        if (session.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session is expired");
        }

        UserEntity user = session.getUser();
        TimeTrackingService.TimeTrackingResult timeResult = timeTrackingService.apply(
                user.getId(),
                session.getAction(),
                session.getBreakMinutes()
        );
        user.setLoggedIn(timeResult.checkedIn());
        session.setUsed(true);
        session.setSuccess(timeResult.success());

        userRepository.save(user);
        authSessionRepository.save(session);

        return new MessageResponse(timeResult.success(), timeResult.message());
    }

    @Transactional(readOnly = true)
    public AuthStatusResponse status(Long sessionId) {
        return toStatus(getSession(sessionId));
    }

    @Transactional(readOnly = true)
    public PendingAuthSessionResponse latestPending(String username) {
        AuthSessionEntity session = authSessionRepository
                .findFirstByUserUsernameAndUsedFalseAndSuccessFalseAndExpiresAtAfterOrderByCreatedAtDescIdDesc(
                        username,
                        Instant.now()
                )
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No pending auth session found"
                ));

        return toPending(session);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> users() {
        return userRepository.findAll().stream()
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.isLoggedIn()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> sessions() {
        return authSessionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toSession)
                .toList();
    }

    public MessageResponse verifyDevicePlaceholder() {
        return new MessageResponse(false, "Real device verification is not implemented yet");
    }

    private AuthSessionEntity getSession(Long sessionId) {
        return authSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
    }

    private AuthStatusResponse toStatus(AuthSessionEntity session) {
        UserEntity user = session.getUser();
        return new AuthStatusResponse(
                session.getId(),
                user.getUsername(),
                session.getAction(),
                session.isUsed(),
                session.isSuccess(),
                user.isLoggedIn()
        );
    }

    private SessionResponse toSession(AuthSessionEntity session) {
        return new SessionResponse(
                session.getId(),
                session.getUser().getUsername(),
                session.getChallenge(),
                session.getAction(),
                session.getExpiresAt(),
                session.isUsed(),
                session.isSuccess(),
                session.getCreatedAt()
        );
    }

    private PendingAuthSessionResponse toPending(AuthSessionEntity session) {
        return new PendingAuthSessionResponse(
                session.getId(),
                session.getUser().getUsername(),
                session.getAction(),
                session.getChallenge(),
                session.getExpiresAt()
        );
    }

    private String createChallenge() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
