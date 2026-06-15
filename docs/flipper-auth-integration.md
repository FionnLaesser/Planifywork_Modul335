# Flipper Auth Integration

Aus `TestFlipperZero` wurden Backend, Web-Dashboard, Android-HCE-Mobile-Code, Flipper-App und ESP32-Firmware in `Planifywork` übernommen.

## Struktur

| Pfad | Inhalt |
|---|---|
| `backend/flipper-auth-service` | Spring Boot Service für Flipper-Auth-Sessions |
| `frontend/flipper-auth-web` | React Dashboard für Flipper-Auth-Testabläufe |
| `mobile/lib/screens/checkin_screen.dart` | Check-in/Check-out startet Flipper-Challenges und wartet auf die Devboard-Bestätigung |
| `mobile/android` | Android-Unterbau mit NFC Host Card Emulation |
| `firmware/flipper-auth-hce-reader` | Flipper Zero App, liest Android-HCE und sendet `SESSION_ID:<id>` per UART |
| `firmware/esp32-devboard-http-test` | ESP32/WiFi-Devboard-Test, sendet Session an das Backend |

## API

Der bestehende Login unter `/api/auth/login` bleibt unverändert. Flipper-Auth läuft neu unter:

```text
POST /api/flipper-auth/start
POST /api/flipper-auth/simulate-device
GET  /api/flipper-auth/status/{sessionId}
GET  /api/flipper-auth/latest-pending?username=emp.meier
POST /api/flipper-auth/verify-device
GET  /api/time/latest/{employeeId}
GET  /api/flipper-auth/admin/users
GET  /api/flipper-auth/admin/sessions
```

Der Service läuft intern auf Port `8009` und ist über den API-Gateway auf Port `8000` erreichbar.

## Start

Gesamtes System:

```bash
docker compose up --build -d
```

Nur Flipper-Auth-Service neu bauen:

```bash
docker compose up --build flipper-auth-service -d
```

Flipper-Dashboard:

```text
http://localhost:3004
```

Für Mobile im Android-Emulator bleibt die Gateway-URL:

```text
http://10.0.2.2:8000
```

Für ein echtes Handy oder ESP32-Devboard muss die lokale IP des PCs verwendet werden, zum Beispiel:

```text
http://192.168.1.50:8000
```

## Testablauf

1. Docker-Stack starten.
2. Als `emp.meier` / `password` in der Workforce-Mobile-App anmelden.
3. Im Mobile-Tab `Check-in` Check-in oder Check-out drücken.
4. Die Mobile-App erstellt eine Flipper-Session, setzt die HCE-Payload und wartet.
5. Android entsperrt an den Flipper halten.
6. Die Flipper-App `Auth HCE Reader` liest die HCE-Payload.
7. Das WiFi Devboard empfängt `SESSION_ID:<id>` per UART.
8. Das Devboard ruft `POST /api/flipper-auth/simulate-device` über den Gateway auf.
9. Erst danach startet oder stoppt die Mobile-App die angezeigte Arbeitszeit.

Die sichere HMAC-/Nonce-Prüfung ist weiterhin nur vorbereitet; `verify-device` ist noch ein Platzhalter.
