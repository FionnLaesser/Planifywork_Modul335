package com.workforce.user.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Utility-Klasse für die Verarbeitung und Validierung von JWT-Tokens.
 * Wird vom {@link JwtAuthFilter} verwendet, um eingehende Requests zu authentifizieren.
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    /**
     * Erstellt den kryptographischen Schlüssel aus dem konfigurierten Secret.
     *
     * @return HMAC-SHA SecretKey
     */
    private SecretKey key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Extrahiert den Benutzernamen (Subject) aus einem JWT-Token.
     *
     * @param token JWT-Token als String
     * @return Benutzername
     */
    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * Extrahiert die Rolle des Benutzers aus dem JWT-Token.
     *
     * @param token JWT-Token als String
     * @return Rolle (z.B. "HR", "ADMIN", "SHIFT_LEAD", "EMPLOYEE")
     */
    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    /**
     * Prüft ob ein JWT-Token gültig und nicht abgelaufen ist.
     *
     * @param token JWT-Token als String
     * @return {@code true} wenn gültig, {@code false} bei ungültigem oder abgelaufenem Token
     */
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    /**
     * Parsed den JWT-Token und gibt die enthaltenen Claims zurück.
     *
     * @param token JWT-Token als String
     * @return {@link Claims} Objekt mit allen Token-Informationen
     * @throws JwtException bei ungültigem oder abgelaufenem Token
     */
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
