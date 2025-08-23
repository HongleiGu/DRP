package com.lumiroom.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.lumiroom.interceptor.AuthInterceptor;
import com.lumiroom.utils.OtpUtils;

/**
 * Security configuration for Lumiroom.
 * <p>
 * This configuration applies both a custom interceptor and Spring Security
 * settings:
 * </p>
 *
 * <h3>Interceptor Layer</h3>
 * <ul>
 * <li>Applies {@link AuthInterceptor} to <strong>all incoming routes</strong>
 * (<code>/**</code>).</li>
 * <li>Excludes all routes under <code>/api/auth/**</code> from interception
 * so that authentication endpoints (login, register, OTP requests) remain
 * accessible without prior authentication.</li>
 * </ul>
 *
 * <h3>Spring Security Layer</h3>
 * <ul>
 * <li><strong>CSRF protection is completely disabled</strong> — all requests
 * bypass CSRF checks.</li>
 * <li><strong>All HTTP requests are permitted</strong> at the Spring Security
 * filter level —
 * route access control is handled exclusively by the interceptor layer.</li>
 * </ul>
 *
 * <h3>Password Encoding</h3>
 * <ul>
 * <li>Uses {@link BCryptPasswordEncoder} for secure password hashing.</li>
 * </ul>
 *
 * <h3>OTP Utility</h3>
 * <ul>
 * <li>Provides a singleton {@link OtpUtils} bean for generating and verifying
 * one-time passwords.</li>
 * </ul>
 *
 * @implNote
 *           This design delegates actual route protection logic to
 *           {@link AuthInterceptor}.
 *           Spring Security is configured permissively to avoid
 *           double-enforcement and to simplify integration.
 */
@Order(1)
@Configuration
public class SecurityConfig implements WebMvcConfigurer {

    @Autowired
    private AuthInterceptor authInterceptor;

    /**
     * Registers the {@link AuthInterceptor} for all routes except authentication
     * endpoints.
     *
     * @param registry the interceptor registry
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/**") // Intercept all routes
                .excludePathPatterns("/api/auth/**"); // Allow /api/auth/** without interception
    }

    /**
     * Configures Spring Security to:
     * <ul>
     * <li>Disable CSRF checks entirely.</li>
     * <li>Allow all requests through without authentication.</li>
     * </ul>
     *
     * @param http the HTTP security builder
     * @return the configured {@link SecurityFilterChain}
     * @throws Exception if configuration fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disable CSRF completely
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll() // Allow all requests
                );
        return http.build();
    }

    /**
     * Provides a BCrypt-based password encoder.
     *
     * @return a {@link PasswordEncoder} using BCrypt
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Provides the OTP utility bean for generating and validating one-time
     * passwords.
     *
     * @return an instance of {@link OtpUtils}
     */
    @Bean
    public OtpUtils otpUtils() {
        return new OtpUtils();
    }

    /**
     * Allows Cross-Origin Resource Sharing (CORS) for all endpoints.
     *
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Apply to all endpoints
                .allowedOrigins("*") // Allow all origins
                .allowedMethods("GET", "POST", "PUT", "DELETE") // Specify allowed methods
                .allowedHeaders("*") // Allow all headers
                .allowCredentials(true); // Allow cookies or credentials if necessary
    }
}
