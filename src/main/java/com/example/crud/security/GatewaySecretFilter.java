package com.example.crud.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Rechaza con 403 toda llamada a /api/** que no haya pasado por AWS API Gateway.
 *
 * Por qué funciona:
 * - El puerto 80 de la EC2 tiene que estar abierto a Internet, porque API Gateway
 *   (HTTP API) llama al backend desde IPs públicas de AWS. Por eso cualquiera que
 *   conozca la IP podría saltarse el Gateway (y su throttling, rutas y logs).
 * - Para distinguir quién llama, el Gateway agrega el header X-Gateway-Secret
 *   (definido en infra/api-gateway.yaml) en cada petición que reenvía. El valor
 *   solo lo conocen AWS y la EC2 (llega aquí por la variable de entorno GATEWAY_SECRET).
 * - Un cliente que llama directo a la IP no tiene el secreto, así que recibe 403.
 *   Uno que llama por el Gateway no necesita conocerlo: el Gateway lo pone por él.
 *
 * Por qué es un filtro y no código en el Controller:
 * - Un filtro de Servlet corre ANTES de que Spring elija el Controller. Es la capa
 *   de seguridad/transversal: Controller, Service y Repository ni se enteran, y
 *   cualquier endpoint nuevo bajo /api queda protegido automáticamente.
 */
@Component
public class GatewaySecretFilter extends OncePerRequestFilter {

    static final String HEADER = "X-Gateway-Secret";

    private static final Logger log = LoggerFactory.getLogger(GatewaySecretFilter.class);

    private final byte[] expectedSecret;

    // gateway.secret se define en application.properties a partir de GATEWAY_SECRET
    public GatewaySecretFilter(@Value("${gateway.secret:}") String secret) {
        this.expectedSecret = secret.getBytes(StandardCharsets.UTF_8);
        if (secret.isBlank()) {
            // Sin secreto (desarrollo local, docker compose en tu PC) el filtro se apaga
            // para poder usar la app sin Gateway. En AWS el user data siempre lo define.
            log.warn("GATEWAY_SECRET no está definido: /api/** queda accesible sin pasar por API Gateway");
        }
    }

    /**
     * Decide a qué peticiones NO se aplica el filtro:
     * - si no hay secreto configurado (modo local), a ninguna;
     * - el frontend estático (/, /css, /js...) no se protege: solo la API.
     *
     * Se usa getServletPath() y no getRequestURI() porque Tomcat ya lo normalizó
     * (resuelve "//api", "/./api", "%2e"...), así no se puede esquivar el filtro
     * escribiendo la ruta de forma rara.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return expectedSecret.length == 0 || !request.getServletPath().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String received = request.getHeader(HEADER);

        // MessageDigest.isEqual compara en tiempo constante: tarda lo mismo sin importar
        // en qué carácter falle. Con equals() un atacante podría medir tiempos de
        // respuesta para adivinar el secreto carácter por carácter.
        if (received == null
                || !MessageDigest.isEqual(expectedSecret, received.getBytes(StandardCharsets.UTF_8))) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            // Mismo formato de error que ProductController ({"error": "..."})
            response.getWriter().write("{\"error\":\"Forbidden: use the API Gateway URL\"}");
            return; // no se llama a filterChain: la petición nunca llega al Controller
        }

        filterChain.doFilter(request, response);
    }
}
