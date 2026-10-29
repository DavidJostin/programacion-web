package com.example.crud.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * Prueba el filtro aislado, sin levantar Spring ni PostgreSQL.
 * MockFilterChain guarda la petición si el filtro la deja pasar (getRequest() != null).
 */
class GatewaySecretFilterTest {

    private static final String SECRET = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4";

    private MockFilterChain run(GatewaySecretFilter filter, String path, String header,
            MockHttpServletResponse response) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        request.setServletPath(path);
        if (header != null) {
            request.addHeader(GatewaySecretFilter.HEADER, header);
        }
        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(request, response, chain);
        return chain;
    }

    @Test
    void missingHeaderIsRejected() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = run(new GatewaySecretFilter(SECRET), "/api/products", null, response);

        assertEquals(403, response.getStatus());
        assertNull(chain.getRequest());   // nunca llegó al Controller
    }

    @Test
    void wrongSecretIsRejected() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = run(new GatewaySecretFilter(SECRET), "/api/products/1", "adivinado", response);

        assertEquals(403, response.getStatus());
        assertNull(chain.getRequest());
    }

    @Test
    void correctSecretPasses() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = run(new GatewaySecretFilter(SECRET), "/api/products", SECRET, response);

        assertEquals(200, response.getStatus());
        assertNotNull(chain.getRequest());
    }

    @Test
    void staticFrontendIsNotProtected() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = run(new GatewaySecretFilter(SECRET), "/index.html", null, response);

        assertNotNull(chain.getRequest());
    }

    @Test
    void withoutConfiguredSecretFilterIsOff() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = run(new GatewaySecretFilter(""), "/api/products", null, response);

        assertNotNull(chain.getRequest());
    }
}
