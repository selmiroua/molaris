package com.projet.molarisse.security;

import com.projet.molarisse.user.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Service;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Service
@RequiredArgsConstructor
// bch nrj3ouha filter lezm el extends ethika
public class JwtFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        logger.debug("Processing request for path: {}", request.getServletPath());
        
        // Skip filter for OPTIONS requests and certain paths
        if (request.getMethod().equals("OPTIONS") || shouldSkipFilter(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        logger.debug("Authorization header: {}", authHeader != null ? "present" : "not present");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);
            final String userEmail = jwtService.extractUsername(jwt);
            logger.debug("JWT token extracted, user email: {}", userEmail);
            
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    // Create authentication token without checking account locked status
                    var authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.debug("Authentication set for user: {}", userEmail);
                } else {
                    logger.debug("Token is not valid for user: {}", userEmail);
                }
            }
        } catch (Exception e) {
            logger.error("Error processing JWT token", e);
            throw new AuthenticationServiceException("Error processing JWT token", e);
        }

        filterChain.doFilter(request, response);
    }
    
    private boolean shouldSkipFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.contains("/auth/authenticate") || 
               path.contains("/auth/register") || 
               path.contains("/auth/roles") || 
               path.contains("/auth/activate-account") ||
               path.contains("/auth/forgot-password") ||
               path.contains("/auth/reset-password") ||
               path.contains("/auth/verify-reset-token") ||
               path.contains("/swagger") ||
               path.contains("/api-docs");
    }
}
