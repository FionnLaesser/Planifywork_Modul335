# Mobile App – Setup & Konfiguration

## Voraussetzungen

| Tool | Version | Prüfen mit |
|------|---------|------------|
| Flutter | 3.44.x (stable) | `flutter --version` |
| Android SDK | 36 (via Android Studio) | `flutter doctor` |
| Android Emulator | Pixel / API 37 | Android Studio AVD Manager |
| Docker | beliebig | `docker ps` |

---

## 1. Backend starten

Das gesamte Backend läuft via Docker Compose im Root-Verzeichnis des Projekts:

```bash
# Im Root-Verzeichnis (wo docker-compose.yml liegt)
docker-compose up -d
```

Der API-Gateway ist dann erreichbar unter: `http://localhost:8000`

---

## 2. API-URL konfigurieren

Die Backend-URL wird zentral in einer einzigen Datei gesetzt:

**`lib/services/api_config.dart`**

```dart
class ApiConfig {
  static const String baseUrl = 'http://10.0.2.2:8000';
  static const Duration requestTimeout = Duration(seconds: 8);
}
```

### Wann welche URL verwenden

| Szenario | URL |
|----------|-----|
| Android Emulator | `http://10.0.2.2:8000` |
| Echtes Gerät (selbes WLAN) | `http://<lokale-IP-des-Rechners>:8000` |
| iOS Simulator | `http://localhost:8000` |

> **Hinweis:** `10.0.2.2` ist die feste Adresse, über die der Android-Emulator den Host-Rechner (localhost) erreicht. Diese IP ändert sich nie.
>
> Die lokale IP des Rechners findet man mit `ipconfig` (Windows) oder `ifconfig` (Mac/Linux). Beispiel: `192.168.1.42`.

---

## 3. Android SDK Problem (android-36 ohne android.jar)

### Problem

Android SDK Platform 36 wird von Google aktuell als unvollständige Extension-SDK ausgeliefert — ohne `android.jar`. Das führt beim Build zu:

```
Could not determine the dependencies of task ':app:compileDebugJavaWithJavac'.
> Cannot query the value of this provider because it has no value available.
```

### Lösung (einmalig ausführen)

```bash
# android.jar aus der vollständigen android-36.1 Platform kopieren
cp "$ANDROID_HOME/platforms/android-36.1/android.jar"             "$ANDROID_HOME/platforms/android-36/android.jar"
cp "$ANDROID_HOME/platforms/android-36.1/build.prop"              "$ANDROID_HOME/platforms/android-36/build.prop"
cp "$ANDROID_HOME/platforms/android-36.1/core-for-system-modules.jar" "$ANDROID_HOME/platforms/android-36/core-for-system-modules.jar"
```

Auf Windows (`$ANDROID_HOME` = `C:\Users\<user>\AppData\Local\Android\Sdk`):

```
Quelle:  ...\platforms\android-36.1\android.jar
Ziel:    ...\platforms\android-36\android.jar
```

> Beide Plattformen (36 und 36.1) liefern dieselben Kern-APIs. Das Kopieren ist sicher.

---

## 4. Build-Versionen (android/)

Die folgenden Versionen sind getestet und funktionieren:

**`android/gradle/wrapper/gradle-wrapper.properties`**
```
distributionUrl=.../gradle-8.13-all.zip
```

**`android/settings.gradle.kts`**
```kotlin
id("com.android.application") version "8.11.1" apply false
id("org.jetbrains.kotlin.android") version "2.3.20" apply false
```

> **Wichtig:** AGP 9.x funktioniert **nicht** mit dem Flutter Gradle Plugin (3.44.x). Der Flutter-Plugin wurde gegen AGP 8.11.1 kompiliert. Nicht auf AGP 9.x upgraden bis Flutter offiziell Support ankündigt.

---

## 5. App starten

```bash
# Im mobile/ Verzeichnis
flutter pub get
flutter run -d emulator-5554
```

### Hot Reload / Restart (während flutter run läuft)

| Befehl | Wirkung |
|--------|---------|
| `r` | Hot Reload – Code neu laden, Zustand bleibt |
| `R` | Hot Restart – App neu starten |
| `q` | Beenden |

---

## 6. Projektstruktur

```
lib/
├── main.dart                  # App-Einstiegspunkt, Provider-Setup
├── services/
│   ├── api_config.dart        # ← Backend-URL hier anpassen
│   ├── api_service.dart       # HTTP GET/POST/Upload mit Auth-Header
│   └── auth_service.dart      # Login, Logout, JWT-Token-Verwaltung
└── screens/
    ├── login_screen.dart      # Login-Formular
    ├── home_screen.dart       # Hauptmenü nach Login
    ├── absence_screen.dart    # Abwesenheiten
    ├── calendar_screen.dart   # Kalender
    ├── checkin_screen.dart    # Check-in/Check-out
    └── report_screen.dart     # Berichte
```

---

## 7. Authentifizierung

Login-Endpoint: `POST /api/auth/login`

```json
{ "username": "...", "password": "..." }
```

Antwort:
```json
{ "token": "...", "role": "EMPLOYEE", "username": "...", "userId": 1 }
```

Das JWT-Token wird im `SharedPreferences` gespeichert und bei jedem API-Request als `Authorization: Bearer <token>` Header mitgeschickt.
