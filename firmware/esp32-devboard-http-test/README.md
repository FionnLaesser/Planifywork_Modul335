# ESP32 Devboard HTTP Test

Diese Beispiel-Firmware ist nur für den MVP-Test gedacht. Sie beweist, dass ein ESP32 oder WiFi Devboard per WLAN mit dem Spring Boot Backend sprechen kann und eine `sessionId` vom Flipper per UART weiterverarbeiten kann.

Die echte Version soll später `POST /api/flipper-auth/verify-device` verwenden und die Daten mit HMAC-SHA256 sowie Nonce-Schutz absichern.

## MVP UART Ablauf

Der Flipper sendet nach erfolgreichem Android-HCE-Lesen diese UART-Zeile mit `115200` Baud:

```text
SESSION_ID:12
```

Das Devboard liest die Zeile über `Serial1`, extrahiert die `sessionId` und ruft direkt auf:

```text
POST /api/flipper-auth/simulate-device
{"sessionId":12}
```

Das ist noch keine echte Sicherheit. Es gibt noch keinen HMAC, keine Challenge-Prüfung und keine echte Device-Verifikation.

Für das offizielle Flipper WiFi Devboard sind die UART-Pins auf ESP32-S2 UART0 gesetzt:

```cpp
const int FLIPPER_UART_RX_PIN = 44;
const int FLIPPER_UART_TX_PIN = 43;
```

Wenn du kein offizielles WiFi Devboard verwendest, passe diese Pins an dein Board an. `RX` vom ESP muss mit `TXD0` vom Flipper verbunden sein.

## Arduino IDE

1. Arduino IDE installieren.
2. ESP32 Board Support installieren.
3. Datei `esp32-devboard-http-test.ino` öffnen.
4. `WIFI_SSID`, `WIFI_PASSWORD` und `BACKEND_BASE_URL` anpassen.
5. Board und Port auswählen.
6. Für ESP32-S2 `USB CDC On Boot` aktivieren, damit der Serial Monitor über USB läuft.
7. Sketch hochladen.
8. Serial Monitor mit `115200` Baud öffnen.

## PlatformIO

1. Diesen Ordner in PlatformIO öffnen.
2. `WIFI_SSID`, `WIFI_PASSWORD` und `BACKEND_BASE_URL` anpassen.
3. Firmware mit `pio run` bauen.
4. Firmware mit `pio run --target upload` hochladen.
5. Serial Monitor mit `pio device monitor --baud 115200` öffnen.

## Testablauf mit UART

1. Backend auf dem PC starten.
2. Die IP vom PC im gleichen WLAN ermitteln, zum Beispiel `192.168.1.50`.
3. In der Firmware `BACKEND_BASE_URL` auf `http://192.168.1.50:8000` setzen.
4. In Flutter im Tab `Check-in` Check-in oder Check-out für `emp.meier` starten.
5. Android an den Flipper halten.
6. Der Flipper liest die HCE-Payload und sendet `SESSION_ID:<id>` per UART.
7. Das Devboard ruft `POST /api/flipper-auth/simulate-device` auf.
8. Die App beendet das Warten, sobald das Backend die Zeiterfassung bestätigt.

## Fallback Testmodus

Die alte `GET /api/flipper-auth/latest-pending?username=emp.meier` Polling-Logik ist standardmässig deaktiviert, damit der echte Handy-Flipper-Devboard-Pfad getestet wird:

```cpp
const bool ENABLE_LATEST_PENDING_FALLBACK = false;
```

Setze sie nur für einen reinen Devboard-Test auf `true`.

Wenn keine offene Session existiert, antwortet das Backend mit `404` und `No pending auth session found`.
