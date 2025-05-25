package com.projet.molarisse.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Filter that handles authentication via JWT token in URL parameters
 * Specifically designed for document endpoints where tokens are passed via query params
 */
@Component
@RequiredArgsConstructor
public class JwtTokenParameterFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtTokenParameterFilter.class);
    
    private final JwtService jwtService;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request, 
            HttpServletResponse response, 
            FilterChain filterChain) throws ServletException, IOException {
        
        // Only process requests for document endpoints
        String servletPath = request.getServletPath();
        if (!servletPath.startsWith("/api/users/documents/")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Extract token from query parameter
        String token = request.getParameter("token");
        
        // If token is null or empty, continue to the next filter
        if (token == null || token.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }
        
        logger.debug("JWT token found in URL parameter: {}", token.substring(0, Math.min(token.length(), 20)) + "...");
        
        try {
            // Extract claims from token
            Claims claims = jwtService.extractAllClaims(token);
            String username = claims.getSubject();
            
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Create authorities from the authorities claim
                @SuppressWarnings("unchecked")
                List<String> authorities = (List<String>) claims.get("authorities");
                
                List<SimpleGrantedAuthority> grantedAuthorities = authorities != null ? 
                    authorities.stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList()) : 
                    List.of();
                
                // Create user details
                UserDetails userDetails = new User(username, "", grantedAuthorities);
                
                // Create authentication token
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
                );
                
                // Set authentication in security context
                SecurityContextHolder.getContext().setAuthentication(authToken);
                logger.debug("Authentication set for user: {}", username);
            }
        } catch (Exception e) {
            logger.error("Error validating JWT token from URL parameter", e);
        }
        
        filterChain.doFilter(request, response);
    }
} 