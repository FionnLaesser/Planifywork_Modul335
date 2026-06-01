# Mitarbeiter Mobile App – User Stories

## US-101: Arbeitskalender anzeigen

### 1. Story-ID

US-101

### 2. Titel

Arbeitskalender anzeigen

### 3. Userstory

Als **Mitarbeiter** möchte ich **meinen Arbeitskalender einsehen**, damit **ich meine geplanten Schichten und Arbeitseinsätze jederzeit kennen kann**.

### 4. Beschreibung

Die Mobile-App soll dem Mitarbeiter einen persönlichen Kalender bereitstellen. Der Kalender zeigt alle geplanten Arbeitszeiten, Schichten und zugewiesenen Einsätze an.

### 5. Akzeptanzkriterien

#### AK-1: Kalender öffnen

**Given** der Mitarbeiter ist angemeldet
**When** er den Arbeitskalender öffnet
**Then** werden alle zukünftigen Schichten angezeigt

#### AK-2: Schichtdetails anzeigen

**Given** eine Schicht ist im Kalender vorhanden
**When** der Mitarbeiter die Schicht auswählt
**Then** werden Detailinformationen angezeigt

#### AK-3: Aktualisierte Planung anzeigen

**Given** eine Schicht wurde geändert
**When** der Mitarbeiter den Kalender aktualisiert
**Then** wird die aktuelle Planung angezeigt

### 6. Randfälle und Fehlerfälle

* Keine Schichten vorhanden
* Kalenderdaten können nicht geladen werden
* Netzwerkverbindung nicht verfügbar

### 7. Nicht-funktionale Anforderungen

* Ladezeit unter 3 Sekunden
* Mobile Optimierung für Android und iOS
* Zugriff nur für angemeldete Benutzer

### 8. Abhängigkeiten

* Planning Service
* Benutzerverwaltung

### 9. Offene Fragen

* Soll eine Monats- und Wochenansicht verfügbar sein?
* Soll ein Export in externe Kalender möglich sein?

---

## US-102: Check-in durchführen

### 1. Story-ID

US-102

### 2. Titel

Check-in durchführen

### 3. Userstory

Als **Mitarbeiter** möchte ich **mich beim Arbeitsbeginn einchecken**, damit **meine Arbeitszeit automatisch erfasst wird**.

### 4. Beschreibung

Die Mobile-App soll die Erfassung des Arbeitsbeginns ermöglichen. Die Check-in-Zeit wird gespeichert und für die Arbeitszeitberechnung verwendet.

### 5. Akzeptanzkriterien

#### AK-1: Erfolgreicher Check-in

**Given** der Mitarbeiter ist angemeldet
**When** er auf Check-in klickt
**Then** wird die aktuelle Uhrzeit gespeichert

#### AK-2: Status anzeigen

**Given** ein Check-in wurde durchgeführt
**When** der Mitarbeiter die Zeiterfassung öffnet
**Then** wird der Status „Eingecheckt“ angezeigt

#### AK-3: Doppelten Check-in verhindern

**Given** der Mitarbeiter ist bereits eingecheckt
**When** er erneut auf Check-in klickt
**Then** wird keine zweite Zeiterfassung erstellt

### 6. Randfälle und Fehlerfälle

* Doppelte Check-ins
* Fehlende Internetverbindung
* Server nicht erreichbar

### 7. Nicht-funktionale Anforderungen

* Speicherung innerhalb von 2 Sekunden
* Manipulationssichere Zeiterfassung
* Mobile Bedienbarkeit

### 8. Abhängigkeiten

* Time Service
* Auth Service

### 9. Offene Fragen

* Soll GPS beim Check-in erfasst werden?
* Soll Offline-Check-in unterstützt werden?

---

## US-103: Check-out durchführen

### 1. Story-ID

US-103

### 2. Titel

Check-out durchführen

### 3. Userstory

Als **Mitarbeiter** möchte ich **mich bei Arbeitsende auschecken**, damit **meine Arbeitszeit korrekt abgeschlossen wird**.

### 4. Beschreibung

Die Mobile-App ermöglicht die Erfassung des Arbeitsendes zur Berechnung der geleisteten Arbeitsstunden.

### 5. Akzeptanzkriterien

#### AK-1: Erfolgreicher Check-out

**Given** der Mitarbeiter ist eingecheckt
**When** er auf Check-out klickt
**Then** wird die Endzeit gespeichert

#### AK-2: Stunden berechnen

**Given** Check-in und Check-out sind vorhanden
**When** die Erfassung abgeschlossen wird
**Then** werden die Arbeitsstunden berechnet

#### AK-3: Check-out ohne Check-in verhindern

**Given** kein Check-in existiert
**When** der Mitarbeiter auf Check-out klickt
**Then** wird eine Fehlermeldung angezeigt

### 6. Randfälle und Fehlerfälle

* Check-out ohne Check-in
* Verbindungsfehler
* Mehrfache Check-out-Versuche

### 7. Nicht-funktionale Anforderungen

* Antwortzeit unter 2 Sekunden
* Sichere Speicherung der Zeitdaten
* Mobile Optimierung

### 8. Abhängigkeiten

* Time Service
* Auth Service

### 9. Offene Fragen

* Soll automatisch an einen vergessenen Check-out erinnert werden?

---

## US-104: Ferienantrag über Kalender erstellen

### 1. Story-ID

US-104

### 2. Titel

Ferienantrag erstellen

### 3. Userstory

Als **Mitarbeiter** möchte ich **Ferien direkt über den Kalender beantragen**, damit **mein Urlaub zur Genehmigung eingereicht werden kann**.

### 4. Beschreibung

Der Mitarbeiter kann einen Zeitraum im Kalender auswählen und einen Ferienantrag erstellen.

### 5. Akzeptanzkriterien

#### AK-1: Zeitraum auswählen

**Given** der Kalender ist geöffnet
**When** der Mitarbeiter einen Zeitraum markiert
**Then** kann ein Ferienantrag erstellt werden

#### AK-2: Antrag absenden

**Given** alle Pflichtfelder sind ausgefüllt
**When** der Mitarbeiter den Antrag absendet
**Then** wird der Antrag gespeichert

#### AK-3: Bestätigung anzeigen

**Given** der Antrag wurde gespeichert
**When** die Verarbeitung abgeschlossen ist
**Then** wird eine Bestätigung angezeigt

### 6. Randfälle und Fehlerfälle

* Überschneidende Ferienanträge
* Ungültiger Zeitraum
* Fehlende Angaben

### 7. Nicht-funktionale Anforderungen

* Intuitive Kalenderbedienung
* Sichere Datenübertragung
* Mobile Optimierung

### 8. Abhängigkeiten

* Absence & Vacation Service
* Planning Service

### 9. Offene Fragen

* Soll das verfügbare Ferienguthaben angezeigt werden?

---

## US-105: Absenz erfassen

### 1. Story-ID

US-105

### 2. Titel

Absenz erfassen

### 3. Userstory

Als **Mitarbeiter** möchte ich **eine Absenz erfassen**, damit **meine Abwesenheit dokumentiert werden kann**.

### 4. Beschreibung

Der Mitarbeiter kann Abwesenheiten wie Krankheit oder sonstige Absenzen erfassen und einreichen.

### 5. Akzeptanzkriterien

#### AK-1: Absenz erstellen

**Given** der Mitarbeiter befindet sich im Absenzmodul
**When** er Art und Zeitraum der Absenz eingibt
**Then** wird die Absenz gespeichert

#### AK-2: Absenz anzeigen

**Given** eine Absenz wurde erfasst
**When** der Kalender geöffnet wird
**Then** wird die Absenz angezeigt

#### AK-3: Pflichtfelder prüfen

**Given** erforderliche Angaben fehlen
**When** gespeichert wird
**Then** erscheint eine Fehlermeldung

### 6. Randfälle und Fehlerfälle

* Ungültige Datumsangaben
* Fehlende Angaben
* Serverfehler

### 7. Nicht-funktionale Anforderungen

* Einfache mobile Eingabe
* Datenschutzkonforme Speicherung
* Hohe Verfügbarkeit

### 8. Abhängigkeiten

* Absence & Vacation Service
* Planning Service

### 9. Offene Fragen

* Soll ein Arztzeugnis hochgeladen werden können?
