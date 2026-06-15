package com.workforce.gateway;

import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Schutztests für kritische Infrastruktur-Konfiguration.
 *
 * Schlägt an, wenn jemand versehentlich einen Port, eine Route-URL,
 * den JWT-Secret oder ddl-auto verändert — alles Einstellungen, die
 * bei Falscheingabe den gesamten Stack still brechen.
 */
class GatewayConfigurationTest {

    private static final String JWT_SECRET =
            "workforce-super-secret-jwt-key-change-in-production-min-256-bits";

    // ── Gateway-Port ────────────────────────────────────────────────────────

    @Test
    void gatewayListensOnPort8000() {
        assertThat(gatewayValue("server", "port"))
                .as("API Gateway muss auf Port 8000 lauschen")
                .isEqualTo(8000);
    }

    // ── Routing-Tabelle ─────────────────────────────────────────────────────

    @Test
    void allNineServiceRoutesAreDefined() {
        List<?> routes = (List<?>) gatewayValue("spring", "cloud", "gateway", "routes");
        assertThat(routes)
                .as("Gateway muss genau 9 Routen definieren (eine pro Backend-Service)")
                .hasSize(9);
    }

    @Test
    void routePathsAndBackendUrisAreCorrect() {
        assertRoute("auth-service",             "http://auth-service:8001",            "Path=/api/auth/**");
        assertRoute("user-role-service",        "http://user-role-service:8002",        "Path=/api/users/**");
        assertRoute("order-service",            "http://order-service:8003",            "Path=/api/orders/**");
        assertRoute("planning-service",         "http://planning-service:8004",         "Path=/api/planning/**");
        assertRoute("time-service",             "http://time-service:8005",             "Path=/api/time/**");
        assertRoute("absence-vacation-service", "http://absence-vacation-service:8006", "Path=/api/absences/**");
        assertRoute("billing-service",          "http://billing-service:8007",          "Path=/api/billing/**");
        assertRoute("report-media-service",     "http://report-media-service:8008",     "Path=/api/media/**");
        assertRoute("flipper-auth-service",     "http://flipper-auth-service:8009",     "Path=/api/flipper-auth/**");
    }

    // ── CORS ────────────────────────────────────────────────────────────────

    @Test
    void corsAllowsAllFrontendOrigins() {
        List<?> origins = (List<?>) gatewayValue(
                "spring", "cloud", "gateway", "globalcors",
                "corsConfigurations", "[/**]", "allowedOrigins");
        assertThat(origins)
                .as("CORS muss alle drei Frontend-Ports erlauben")
                .contains(
                        "http://localhost:3001",
                        "http://localhost:3002",
                        "http://localhost:3003"
                );
    }

    // ── JWT-Secret konsistent ───────────────────────────────────────────────

    @Test
    void gatewayJwtSecretIsCorrect() {
        assertThat(gatewayValue("jwt", "secret"))
                .as("JWT-Secret im Gateway")
                .isEqualTo(JWT_SECRET);
    }

    @Test
    void allServicesShareTheSameJwtSecret() {
        assertJwtSecret("auth-service");
        assertJwtSecret("user-role-service");
        assertJwtSecret("order-service");
        assertJwtSecret("planning-service");
        assertJwtSecret("time-service");
        assertJwtSecret("absence-vacation-service");
        assertJwtSecret("billing-service");
        assertJwtSecret("report-media-service");
    }

    // ── Service-Ports stimmen mit Gateway überein ───────────────────────────

    @Test
    void servicePortsMatchGatewayRoutes() {
        assertServicePort("auth-service",             8001);
        assertServicePort("user-role-service",        8002);
        assertServicePort("order-service",            8003);
        assertServicePort("planning-service",         8004);
        assertServicePort("time-service",             8005);
        assertServicePort("absence-vacation-service", 8006);
        assertServicePort("billing-service",          8007);
        assertServicePort("report-media-service",     8008);
    }

    @Test
    void flipperAuthServicePortIs8009() {
        Properties props = loadProperties("flipper-auth-service");
        assertThat(props.getProperty("server.port"))
                .as("flipper-auth-service Port")
                .isEqualTo("8009");
    }

    // ── ddl-auto = validate (kein update, das die geteilte DB verändern würde) ─

    @Test
    void allJpaServicesUseDdlValidate() {
        assertDdlValidate("auth-service");
        assertDdlValidate("user-role-service");
        assertDdlValidate("order-service");
        assertDdlValidate("planning-service");
        assertDdlValidate("time-service");
        assertDdlValidate("absence-vacation-service");
        assertDdlValidate("billing-service");
    }

    @Test
    void flipperAuthServiceUsesDdlValidate() {
        Properties props = loadProperties("flipper-auth-service");
        assertThat(props.getProperty("spring.jpa.hibernate.ddl-auto"))
                .as("flipper-auth-service ddl-auto darf nicht 'update' sein")
                .isEqualTo("validate");
    }

    // ── Hilfsmethoden ───────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private void assertRoute(String routeId, String expectedUri, String expectedPredicate) {
        List<Map<String, Object>> routes =
                (List<Map<String, Object>>) gatewayValue("spring", "cloud", "gateway", "routes");

        Map<String, Object> route = routes.stream()
                .filter(r -> routeId.equals(r.get("id")))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Route fehlt: " + routeId));

        assertThat(route.get("uri"))
                .as("Backend-URI der Route " + routeId)
                .isEqualTo(expectedUri);

        List<?> predicates = (List<?>) route.get("predicates");
        assertThat(predicates)
                .as("Path-Predicate der Route " + routeId)
                .contains(expectedPredicate);
    }

    private void assertServicePort(String serviceName, int expectedPort) {
        Object port = serviceValue(serviceName, "server", "port");
        assertThat(port)
                .as("Port von " + serviceName)
                .isEqualTo(expectedPort);
    }

    private void assertDdlValidate(String serviceName) {
        Object ddl = serviceValue(serviceName, "spring", "jpa", "hibernate", "ddl-auto");
        assertThat(ddl)
                .as("ddl-auto von " + serviceName + " muss 'validate' sein (nicht 'update')")
                .isEqualTo("validate");
    }

    private void assertJwtSecret(String serviceName) {
        Object secret = serviceValue(serviceName, "jwt", "secret");
        assertThat(secret)
                .as("JWT-Secret von " + serviceName)
                .isEqualTo(JWT_SECRET);
    }

    private Object gatewayValue(String... keys) {
        Map<String, Object> cfg = loadClasspathYaml("/application.yml");
        return nested(cfg, keys);
    }

    private Object serviceValue(String serviceName, String... keys) {
        Map<String, Object> cfg = loadServiceYaml(serviceName);
        return nested(cfg, keys);
    }

    private Map<String, Object> loadClasspathYaml(String resource) {
        try (InputStream is = getClass().getResourceAsStream(resource)) {
            assertThat(is).as("Classpath-Ressource nicht gefunden: " + resource).isNotNull();
            return new Yaml().load(is);
        } catch (IOException e) {
            throw new RuntimeException("Fehler beim Lesen von " + resource, e);
        }
    }

    private Map<String, Object> loadServiceYaml(String serviceName) {
        // Maven surefire setzt user.dir auf das Modul-Verzeichnis (backend/api-gateway).
        // Geschwister-Services liegen unter ../serviceName/src/main/resources/application.yml
        Path path = Paths.get("..")
                .resolve(serviceName)
                .resolve("src/main/resources/application.yml");
        try (InputStream is = Files.newInputStream(path)) {
            return new Yaml().load(is);
        } catch (IOException e) {
            throw new RuntimeException(
                    "Kann Konfiguration für " + serviceName + " nicht laden: " + path.toAbsolutePath(), e);
        }
    }

    private Properties loadProperties(String serviceName) {
        Path path = Paths.get("..")
                .resolve(serviceName)
                .resolve("src/main/resources/application.properties");
        Properties props = new Properties();
        try (InputStream is = Files.newInputStream(path)) {
            props.load(is);
        } catch (IOException e) {
            throw new RuntimeException(
                    "Kann Properties für " + serviceName + " nicht laden: " + path.toAbsolutePath(), e);
        }
        return props;
    }

    @SuppressWarnings("unchecked")
    private Object nested(Map<String, Object> map, String... keys) {
        Object current = map;
        for (String key : keys) {
            if (!(current instanceof Map)) {
                return null;
            }
            current = ((Map<String, Object>) current).get(key);
        }
        return current;
    }
}
