package com.workforce.user.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT-Authentifizierungsfilter für den User &amp; Role Service.
 * Wird bei jedem eingehenden HTTP-Request einmal ausgeführt.
 * Liest den Bearer-Token aus dem Authorization-Header, validiert ihn
 * und setzt die Authentifizierung im {@link SecurityContextHolder}.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    /**
     * Verarbeitet den JWT-Token aus dem Authorization-Header.
     * Bei gültigem Token wird die Authentifizierung im Security-Context gesetzt.
     *
     * @param request     eingehender HTTP-Request
     * @param response    ausgehende HTTP-Response
     * @param filterChain die Filter-Chain
     * @throws ServletException bei Servlet-Fehlern
     * @throws IOException      bei I/O-Fehlern
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtUtil.isValid(token)) {
                String username = jwtUtil.extractUsername(token);
                String role     = jwtUtil.extractRole(token);

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                username, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + role))
                        );
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}
