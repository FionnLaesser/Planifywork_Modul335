# User Stories Admin Page - Planifywork

## Inhaltsverzeichnis

- [User Stories Admin Page - Planifywork](#user-stories-admin-page---planifywork)
  - [Inhaltsverzeichnis](#inhaltsverzeichnis)
  - [Quellenbasis und Annahmen](#quellenbasis-und-annahmen)
  - [Annahmen](#annahmen)
  - [1. Aufträge verwalten](#1-aufträge-verwalten)
    - [US-ADM-001: Auftrag erstellen](#us-adm-001-auftrag-erstellen)
    - [US-ADM-002: Auftrag bearbeiten](#us-adm-002-auftrag-bearbeiten)
    - [US-ADM-003: Auftragsstatus verwalten](#us-adm-003-auftragsstatus-verwalten)
  - [2. HR verwalten](#2-hr-verwalten)
    - [US-ADM-004: HR-Benutzer verwalten](#us-adm-004-hr-benutzer-verwalten)
    - [US-ADM-005: HR-Zuständigkeiten festlegen](#us-adm-005-hr-zuständigkeiten-festlegen)
  - [3. Firmenkonzepte verwalten](#3-firmenkonzepte-verwalten)
    - [US-ADM-006: Firmenkonzept erstellen](#us-adm-006-firmenkonzept-erstellen)
    - [US-ADM-007: Firmenkonzept bearbeiten](#us-adm-007-firmenkonzept-bearbeiten)
  - [4. Lohn und Stunden bestimmen](#4-lohn-und-stunden-bestimmen)
    - [US-ADM-008: Stundenregeln definieren](#us-adm-008-stundenregeln-definieren)
    - [US-ADM-009: Lohnregeln definieren](#us-adm-009-lohnregeln-definieren)
    - [US-ADM-010: Stundenübersicht prüfen](#us-adm-010-stundenübersicht-prüfen)
  - [5. Mitarbeiter verwalten](#5-mitarbeiter-verwalten)
    - [US-ADM-011: Mitarbeiter erfassen](#us-adm-011-mitarbeiter-erfassen)
    - [US-ADM-012: Mitarbeiter bearbeiten oder deaktivieren](#us-adm-012-mitarbeiter-bearbeiten-oder-deaktivieren)
  - [6. Rollen und Berechtigungen](#6-rollen-und-berechtigungen)
    - [US-ADM-013: Rollen verwalten](#us-adm-013-rollen-verwalten)
    - [US-ADM-014: Berechtigungen prüfen](#us-adm-014-berechtigungen-prüfen)
  - [7. Dashboard mit Übersicht](#7-dashboard-mit-übersicht)
    - [US-ADM-015: Admin-Dashboard anzeigen](#us-adm-015-admin-dashboard-anzeigen)
  - [8. Berichte und Statistiken](#8-berichte-und-statistiken)
    - [US-ADM-016: Berichte anzeigen](#us-adm-016-berichte-anzeigen)
    - [US-ADM-017: Rapport- und Bildnachweise prüfen](#us-adm-017-rapport--und-bildnachweise-prüfen)
  - [9. Benachrichtigungen und wichtige Hinweise](#9-benachrichtigungen-und-wichtige-hinweise)
    - [US-ADM-018: Wichtige Hinweise anzeigen](#us-adm-018-wichtige-hinweise-anzeigen)
  - [10. Suche, Filter und Sortierung](#10-suche-filter-und-sortierung)
    - [US-ADM-019: Daten suchen und filtern](#us-adm-019-daten-suchen-und-filtern)
  - [11. Änderungsverlauf und Audit-Log](#11-änderungsverlauf-und-audit-log)
    - [US-ADM-020: Audit-Log anzeigen](#us-adm-020-audit-log-anzeigen)
  - [12. Systemweite Admin-Funktionen](#12-systemweite-admin-funktionen)
    - [US-ADM-021: Zugriff auf Admin Page schützen](#us-adm-021-zugriff-auf-admin-page-schützen)
    - [US-ADM-022: Systemdaten konsistent anzeigen](#us-adm-022-systemdaten-konsistent-anzeigen)
  - [1.	Aufträge erstellen, bearbeiten, zuweisen und überwachen](#1aufträge-erstellen-bearbeiten-zuweisen-und-überwachen)
  - [2.	HR-Benutzer und HR-Zuständigkeiten verwalten](#2hr-benutzer-und-hr-zuständigkeiten-verwalten)
  - [3.	Firmenkonzepte und betriebliche Regeln pflegen](#3firmenkonzepte-und-betriebliche-regeln-pflegen)
  - [4.	Lohn- und Stundenregeln bestimmen](#4lohn--und-stundenregeln-bestimmen)
  - [5.	Mitarbeiter erfassen, bearbeiten und deaktivieren](#5mitarbeiter-erfassen-bearbeiten-und-deaktivieren)
  - [6.	Rollen und Berechtigungen schützen](#6rollen-und-berechtigungen-schützen)
  - [7.	Dashboard mit aktuellen Kennzahlen anzeigen](#7dashboard-mit-aktuellen-kennzahlen-anzeigen)
  - [8.	Berichte, Statistiken und Rapporte auswerten](#8berichte-statistiken-und-rapporte-auswerten)
  - [9.	Hinweise zu offenen oder fehlerhaften Daten anzeigen](#9hinweise-zu-offenen-oder-fehlerhaften-daten-anzeigen)
  - [10.	Suche, Filter und Sortierung in Listen ermöglichen](#10suche-filter-und-sortierung-in-listen-ermöglichen)
  - [11.	Audit-Log für wichtige Änderungen bereitstellen](#11audit-log-für-wichtige-änderungen-bereitstellen)
  - [Zusammenfassung der wichtigsten Admin-Bereiche](#zusammenfassung-der-wichtigsten-admin-bereiche)

## Quellenbasis und Annahmen

Die User Stories basieren auf dem Whiteboard zum Projekt Planifywork. Daraus ergeben sich folgende zentrale Rollen und Module:

- **Rollen:** Admin, HR, Schichtleiter, Mitarbeiter
- **Admin Web:** Aufträge verwalten, HR verwalten, Firmenkonzepte, Lohn und Stunden bestimmen
- **HR Web:** Schichtleiterverwaltung, Lohn- und Stundenverwaltung, Rechnungen, Stundenabrechnung, Absenzen und Ferien
- **Schichtleiter Web:** Arbeitspläne für Team erstellen, Aufträge entgegennehmen
- **Mitarbeiter Mobile:** Arbeitskalender, Check-in und Check-out, Ferienanfragen, Absenzen, Rapporte mit Bildern, Auftragsdokumente als PDF, persönliche Informationen ändern

## Annahmen

- Der Admin ist die höchste Rolle im System und darf zentrale Stammdaten, Rollen, Regeln und Übersichten verwalten.
- Firmenkonzepte bedeutet betriebliche Vorgaben wie Arbeitszeitmodelle, Pausenregeln, Lohnregeln, Rapportvorgaben und Standardprozesse.
- Lohn- und Stundenberechnungen werden nicht manuell frei berechnet, sondern über definierte Regeln, geprüfte Zeiten und freigegebene Daten gesteuert.
- Bilder aus mobilen Rapporten werden durch Mitarbeiter hochgeladen und vom Admin nur eingesehen oder geprüft, nicht direkt bearbeitet.

## 1. Aufträge verwalten

### US-ADM-001: Auftrag erstellen

**User Story**

> Als Admin möchte ich neue Aufträge erfassen, damit Schichtleiter und Mitarbeiter diese im System sehen und bearbeiten können.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Auftrag erfolgreich erstellen | Gegeben der Admin befindet sich auf der Seite "Aufträge verwalten" | Wenn der Admin alle Pflichtfelder eines neuen Auftrags ausfüllt und speichert | Dann wird der Auftrag erstellt und in der Auftragsübersicht angezeigt |
| AK-2 | Pflichtfelder prüfen | Gegeben der Admin erstellt einen neuen Auftrag | Wenn Pflichtfelder wie Titel, Firma, Einsatzort, Zeitraum oder zuständige Rolle fehlen | Dann wird der Auftrag nicht gespeichert und die fehlenden Felder werden markiert |
| AK-3 | Auftrag für Schichtleiter verfügbar machen | Gegeben ein Auftrag wurde erfolgreich erstellt | Wenn der Auftrag einem Schichtleiter zugewiesen wird | Dann kann der zuständige Schichtleiter den Auftrag in seiner Webansicht sehen |

### US-ADM-002: Auftrag bearbeiten

**User Story**

> Als Admin möchte ich bestehende Aufträge bearbeiten, damit Änderungen an Einsatzort, Zeitraum, Status oder Zuständigkeit korrekt im System abgebildet werden.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Auftrag aktualisieren | Gegeben ein bestehender Auftrag ist in der Auftragsübersicht vorhanden | Wenn der Admin den Auftrag öffnet, Daten ändert und speichert | Dann werden die geänderten Daten in der Auftragsübersicht angezeigt |
| AK-2 | Änderungen sichtbar machen | Gegeben ein Auftrag wurde einem Schichtleiter zugewiesen | Wenn der Admin relevante Auftragsdaten ändert | Dann sieht der zuständige Schichtleiter die aktualisierten Informationen |
| AK-3 | Ungültige Änderungen verhindern | Gegeben der Admin bearbeitet einen Auftrag | Wenn der Admin ein ungültiges Datum oder widersprüchliche Angaben speichert | Dann wird die Änderung abgelehnt und eine verständliche Fehlermeldung angezeigt |

### US-ADM-003: Auftragsstatus verwalten

**User Story**

> Als Admin möchte ich den Status eines Auftrags ändern, damit klar ersichtlich ist, ob ein Auftrag offen, geplant, aktiv, abgeschlossen oder storniert ist.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Status ändern | Gegeben ein Auftrag ist in der Auftragsübersicht vorhanden | Wenn der Admin den Status des Auftrags ändert | Dann wird der neue Status gespeichert und angezeigt |
| AK-2 | Statusabhängige Sichtbarkeit | Gegeben ein Auftrag wurde abgeschlossen oder storniert | Wenn ein Schichtleiter oder HR die Auftragsübersicht öffnet | Dann wird der Auftrag mit dem korrekten Status angezeigt |
| AK-3 | Statuswechsel protokollieren | Gegeben der Admin ändert den Status eines Auftrags | Wenn die Änderung gespeichert wird | Dann wird der Statuswechsel im Änderungsverlauf dokumentiert |

## 2. HR verwalten

### US-ADM-004: HR-Benutzer verwalten

**User Story**

> Als Admin möchte ich HR-Benutzer erstellen, bearbeiten und deaktivieren, damit HR-Aufgaben durch berechtigte Personen ausgeführt werden können.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | HR-Benutzer erstellen | Gegeben der Admin befindet sich im Bereich "HR verwalten" | Wenn der Admin einen neuen HR-Benutzer mit gültigen Daten erstellt | Dann wird der Benutzer gespeichert und erhält die Rolle HR |
| AK-2 | HR-Benutzer bearbeiten | Gegeben ein HR-Benutzer ist im System vorhanden | Wenn der Admin die Daten des HR-Benutzers ändert und speichert | Dann werden die neuen Daten im System angezeigt |
| AK-3 | HR-Benutzer deaktivieren | Gegeben ein HR-Benutzer ist aktiv | Wenn der Admin diesen Benutzer deaktiviert | Dann kann sich der HR-Benutzer nicht mehr im System anmelden |

### US-ADM-005: HR-Zuständigkeiten festlegen

**User Story**

> Als Admin möchte ich HR-Benutzern Zuständigkeiten zuweisen, damit klar ist, welche Personen für Stunden, Lohn, Absenzen oder Ferien verantwortlich sind.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Zuständigkeit zuweisen | Gegeben ein HR-Benutzer ist vorhanden | Wenn der Admin eine Zuständigkeit wie Stundenverwaltung, Lohnverwaltung oder Absenzen zuweist | Dann wird diese Zuständigkeit beim HR-Benutzer gespeichert |
| AK-2 | Zuständigkeit anzeigen | Gegeben ein HR-Benutzer hat eine Zuständigkeit erhalten | Wenn der Admin die HR-Übersicht öffnet | Dann wird die Zuständigkeit beim entsprechenden HR-Benutzer angezeigt |
| AK-3 | Fehlende Berechtigung verhindern | Gegeben ein HR-Benutzer hat keine Berechtigung für Lohnverwaltung | Wenn dieser Benutzer versucht, Lohnregeln zu bearbeiten | Dann wird der Zugriff verweigert |

## 3. Firmenkonzepte verwalten

### US-ADM-006: Firmenkonzept erstellen

**User Story**

> Als Admin möchte ich Firmenkonzepte erfassen, damit Arbeitszeit-, Lohn-, Rapport- und Absenzenregeln einheitlich im System verwendet werden.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Firmenkonzept erstellen | Gegeben der Admin befindet sich im Bereich "Firmenkonzepte verwalten" | Wenn der Admin ein neues Firmenkonzept mit Namen, Beschreibung und Regeln speichert | Dann wird das Firmenkonzept in der Übersicht angezeigt |
| AK-2 | Pflichtangaben prüfen | Gegeben der Admin erstellt ein Firmenkonzept | Wenn Name oder zentrale Regeln fehlen | Dann wird das Konzept nicht gespeichert und die fehlenden Angaben werden angezeigt |
| AK-3 | Konzept für Aufträge nutzbar machen | Gegeben ein Firmenkonzept wurde erstellt | Wenn der Admin einen Auftrag erstellt oder bearbeitet | Dann kann das Firmenkonzept dem Auftrag zugewiesen werden |

### US-ADM-007: Firmenkonzept bearbeiten

**User Story**

> Als Admin möchte ich bestehende Firmenkonzepte bearbeiten, damit Änderungen an internen Regeln sauber übernommen werden können.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Konzept bearbeiten | Gegeben ein Firmenkonzept ist vorhanden | Wenn der Admin das Konzept öffnet, Änderungen vornimmt und speichert | Dann werden die Änderungen im System gespeichert |
| AK-2 | Auswirkungen sichtbar machen | Gegeben ein Firmenkonzept wird von Aufträgen oder Mitarbeitern verwendet | Wenn der Admin das Konzept ändert | Dann wird angezeigt, welche Bereiche von der Änderung betroffen sind |
| AK-3 | Unvollständige Konzepte verhindern | Gegeben der Admin bearbeitet ein Firmenkonzept | Wenn durch die Änderung Pflichtangaben fehlen | Dann wird das Speichern verhindert |

## 4. Lohn und Stunden bestimmen

### US-ADM-008: Stundenregeln definieren

**User Story**

> Als Admin möchte ich Stundenregeln definieren, damit Arbeitszeiten, Sollstunden, Pausen und Überstunden einheitlich berechnet werden können.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Stundenregel speichern | Gegeben der Admin befindet sich im Bereich "Lohn und Stunden" | Wenn der Admin eine Stundenregel mit Sollstunden, Pausenregel und Überstundenregel speichert | Dann wird die Regel im System gespeichert |
| AK-2 | Regel einem Konzept zuweisen | Gegeben eine Stundenregel ist vorhanden | Wenn der Admin die Regel einem Firmenkonzept zuweist | Dann wird diese Regel für das entsprechende Konzept verwendet |
| AK-3 | Ungültige Regel verhindern | Gegeben der Admin erstellt eine Stundenregel | Wenn Werte fehlen oder widersprüchlich sind | Dann wird die Regel nicht gespeichert |

### US-ADM-009: Lohnregeln definieren

**User Story**

> Als Admin möchte ich Lohnregeln definieren, damit Stunden und Zuschläge korrekt für die Lohnverarbeitung vorbereitet werden können.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Lohnregel erstellen | Gegeben der Admin befindet sich im Bereich "Lohn und Stunden" | Wenn der Admin eine Lohnregel mit Stundenansatz, Zuschlägen und Gültigkeitsdatum speichert | Dann wird die Lohnregel im System gespeichert |
| AK-2 | Lohnregel zuweisen | Gegeben eine Lohnregel ist vorhanden | Wenn der Admin die Lohnregel einem Mitarbeiter, Auftrag oder Firmenkonzept zuweist | Dann wird die Zuordnung gespeichert |
| AK-3 | Gültigkeitszeitraum prüfen | Gegeben der Admin erstellt oder bearbeitet eine Lohnregel | Wenn der Gültigkeitszeitraum ungültig ist | Dann wird die Lohnregel nicht gespeichert und eine Fehlermeldung angezeigt |

### US-ADM-010: Stundenübersicht prüfen

**User Story**

> Als Admin möchte ich erfasste Arbeitsstunden einsehen, damit ich kontrollieren kann, ob Check-in, Check-out und Stundenabrechnung plausibel sind.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Stunden anzeigen | Gegeben Mitarbeiter haben Arbeitszeiten per Mobile App erfasst | Wenn der Admin die Stundenübersicht öffnet | Dann werden Mitarbeiter, Auftrag, Datum, Check-in, Check-out und berechnete Stunden angezeigt |
| AK-2 | Auffällige Einträge markieren | Gegeben ein Stundeneintrag ist unvollständig oder auffällig | Wenn der Admin die Stundenübersicht öffnet | Dann wird der Eintrag als Hinweis oder Warnung markiert |
| AK-3 | Filter nach Zeitraum | Gegeben viele Stundeneinträge sind vorhanden | Wenn der Admin einen Zeitraum auswählt | Dann werden nur die Stunden innerhalb dieses Zeitraums angezeigt |

## 5. Mitarbeiter verwalten

### US-ADM-011: Mitarbeiter erfassen

**User Story**

> Als Admin möchte ich neue Mitarbeiter erfassen, damit sie in der mobilen App und in der Planung verwendet werden können.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Mitarbeiter erstellen | Gegeben der Admin befindet sich im Bereich "Mitarbeiter verwalten" | Wenn der Admin einen neuen Mitarbeiter mit gültigen Pflichtdaten speichert | Dann wird der Mitarbeiter im System erstellt |
| AK-2 | Mobile Nutzung vorbereiten | Gegeben ein Mitarbeiter wurde erstellt | Wenn der Mitarbeiter aktiv ist | Dann kann ihm ein Zugang für die mobile App zugewiesen werden |
| AK-3 | Doppelte Mitarbeiter verhindern | Gegeben ein Mitarbeiter mit derselben eindeutigen Kennung existiert bereits | Wenn der Admin denselben Mitarbeiter erneut speichern möchte | Dann wird das Speichern verhindert |

### US-ADM-012: Mitarbeiter bearbeiten oder deaktivieren

**User Story**

> Als Admin möchte ich Mitarbeiterdaten bearbeiten oder Mitarbeiter deaktivieren, damit Stammdaten aktuell bleiben und ehemalige Mitarbeiter keinen Zugriff mehr haben.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Mitarbeiterdaten bearbeiten | Gegeben ein Mitarbeiter ist vorhanden | Wenn der Admin Stammdaten des Mitarbeiters ändert und speichert | Dann werden die neuen Daten angezeigt |
| AK-2 | Mitarbeiter deaktivieren | Gegeben ein Mitarbeiter ist aktiv | Wenn der Admin den Mitarbeiter deaktiviert | Dann kann der Mitarbeiter keine neuen mobilen Aktionen mehr ausführen |
| AK-3 | Bestehende Daten erhalten | Gegeben ein Mitarbeiter wird deaktiviert | Wenn frühere Stunden, Rapporte oder Absenzen vorhanden sind | Dann bleiben diese Daten für Auswertungen erhalten |

## 6. Rollen und Berechtigungen

### US-ADM-013: Rollen verwalten

**User Story**

> Als Admin möchte ich Rollen wie Admin, HR, Schichtleiter und Mitarbeiter verwalten, damit jede Person nur Zugriff auf passende Funktionen erhält.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Rolle zuweisen | Gegeben ein Benutzer ist im System vorhanden | Wenn der Admin dem Benutzer eine Rolle zuweist | Dann erhält der Benutzer die Berechtigungen dieser Rolle |
| AK-2 | Rollenwechsel speichern | Gegeben ein Benutzer hat bereits eine Rolle | Wenn der Admin die Rolle ändert | Dann wird die neue Rolle gespeichert und beim nächsten Zugriff angewendet |
| AK-3 | Admin-Schutz sicherstellen | Gegeben ein Admin-Benutzer ist angemeldet | Wenn versucht wird, den letzten aktiven Admin zu deaktivieren oder zu entziehen | Dann wird die Aktion verhindert |

### US-ADM-014: Berechtigungen prüfen

**User Story**

> Als Admin möchte ich Berechtigungen pro Rolle kontrollieren, damit sensible Bereiche wie Lohn, Stunden und Benutzerverwaltung geschützt sind.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Berechtigungen anzeigen | Gegeben der Admin öffnet den Bereich "Rollen und Berechtigungen" | Wenn eine Rolle ausgewählt wird | Dann werden die erlaubten Bereiche und Aktionen dieser Rolle angezeigt |
| AK-2 | Zugriff einschränken | Gegeben ein Benutzer hat keine Berechtigung für einen Bereich | Wenn der Benutzer diesen Bereich öffnen möchte | Dann wird der Zugriff verweigert |
| AK-3 | Berechtigungsänderung protokollieren | Gegeben der Admin ändert Berechtigungen einer Rolle | Wenn die Änderung gespeichert wird | Dann wird die Änderung im Audit-Log erfasst |

## 7. Dashboard mit Übersicht

### US-ADM-015: Admin-Dashboard anzeigen

**User Story**

> Als Admin möchte ich ein Dashboard mit den wichtigsten Kennzahlen sehen, damit ich den aktuellen Zustand des HR-Systems schnell überblicken kann.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Übersicht anzeigen | Gegeben der Admin meldet sich im Admin Web an | Wenn das Dashboard geladen wird | Dann werden wichtige Kennzahlen wie offene Aufträge, aktive Mitarbeiter, offene Stundenprüfungen und offene Absenzen angezeigt |
| AK-2 | Direkte Navigation ermöglichen | Gegeben das Dashboard zeigt eine Kennzahl an | Wenn der Admin auf eine Kennzahl klickt | Dann wird der passende Detailbereich geöffnet |
| AK-3 | Leere Daten anzeigen | Gegeben es gibt keine offenen Einträge | Wenn der Admin das Dashboard öffnet | Dann wird ein verständlicher leerer Zustand angezeigt |

## 8. Berichte und Statistiken

### US-ADM-016: Berichte anzeigen

**User Story**

> Als Admin möchte ich Berichte zu Aufträgen, Stunden, Absenzen und Mitarbeitern anzeigen, damit ich die wichtigsten Informationen für Kontrolle und Auswertung nutzen kann.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Bericht nach Bereich anzeigen | Gegeben der Admin befindet sich im Bereich "Berichte und Statistiken" | Wenn der Admin einen Berichtstyp auswählt | Dann werden die passenden Daten angezeigt |
| AK-2 | Zeitraum auswählen | Gegeben ein Bericht wurde geöffnet | Wenn der Admin einen Zeitraum filtert | Dann werden nur Daten aus diesem Zeitraum angezeigt |
| AK-3 | Bericht exportieren | Gegeben ein Bericht ist sichtbar | Wenn der Admin den Bericht exportiert | Dann wird eine Datei mit den angezeigten Berichtsdaten erstellt |

### US-ADM-017: Rapport- und Bildnachweise prüfen

**User Story**

> Als Admin möchte ich Rapporte mit Bildnachweisen einsehen, damit ich nachvollziehen kann, welche Arbeiten durch Mitarbeiter dokumentiert wurden.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Rapporte anzeigen | Gegeben Mitarbeiter haben Rapporte mit Bildern über die Mobile App hochgeladen | Wenn der Admin den Rapportbereich öffnet | Dann werden Auftrag, Mitarbeiter, Datum, Rapporttext und vorhandene Bilder angezeigt |
| AK-2 | Fehlende Nachweise markieren | Gegeben für einen Auftrag wird ein Rapport erwartet | Wenn kein Rapport oder kein Bild vorhanden ist | Dann wird der Auftrag als unvollständig markiert |
| AK-3 | Zugriff schützen | Gegeben ein Benutzer ohne passende Berechtigung öffnet Rapportbilder | Wenn der Zugriff geprüft wird | Dann werden die Bilder nicht angezeigt |

## 9. Benachrichtigungen und wichtige Hinweise

### US-ADM-018: Wichtige Hinweise anzeigen

**User Story**

> Als Admin möchte ich wichtige Hinweise zu offenen Aufgaben und Problemen sehen, damit ich schnell auf fehlende Daten, offene Freigaben oder Fehler reagieren kann.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Hinweise anzeigen | Gegeben es gibt offene Ferienanfragen, unvollständige Stunden oder fehlende Rapporte | Wenn der Admin das Dashboard öffnet | Dann werden diese Hinweise sichtbar angezeigt |
| AK-2 | Hinweis öffnen | Gegeben ein Hinweis ist sichtbar | Wenn der Admin den Hinweis anklickt | Dann wird der passende Detailbereich geöffnet |
| AK-3 | Hinweis aktualisieren | Gegeben ein Problem wurde gelöst | Wenn der Admin die Seite erneut lädt | Dann wird der Hinweis nicht mehr als offen angezeigt |

## 10. Suche, Filter und Sortierung

### US-ADM-019: Daten suchen und filtern

**User Story**

> Als Admin möchte ich Aufträge, Mitarbeiter, HR-Benutzer und Rapporte suchen und filtern, damit ich relevante Datensätze schnell finde.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Suche ausführen | Gegeben der Admin befindet sich in einer Listenansicht | Wenn der Admin einen Suchbegriff eingibt | Dann werden nur passende Einträge angezeigt |
| AK-2 | Filter anwenden | Gegeben eine Liste enthält viele Einträge | Wenn der Admin Filter wie Status, Rolle, Zeitraum oder Auftrag auswählt | Dann wird die Liste entsprechend eingeschränkt |
| AK-3 | Sortierung anwenden | Gegeben eine Liste mit mehreren Spalten ist sichtbar | Wenn der Admin nach einer Spalte sortiert | Dann wird die Liste aufsteigend oder absteigend sortiert |

## 11. Änderungsverlauf und Audit-Log

### US-ADM-020: Audit-Log anzeigen

**User Story**

> Als Admin möchte ich einen Änderungsverlauf einsehen, damit wichtige Änderungen an Benutzern, Rollen, Aufträgen, Lohnregeln und Stunden nachvollziehbar bleiben.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Änderungsverlauf anzeigen | Gegeben Änderungen wurden im System durchgeführt | Wenn der Admin den Audit-Log öffnet | Dann werden Benutzer, Aktion, betroffener Datensatz, Zeitpunkt und Änderung angezeigt |
| AK-2 | Audit-Log filtern | Gegeben viele Log-Einträge sind vorhanden | Wenn der Admin nach Benutzer, Bereich oder Zeitraum filtert | Dann werden nur passende Log-Einträge angezeigt |
| AK-3 | Kritische Änderungen erkennen | Gegeben eine Änderung betrifft Rollen, Berechtigungen oder Lohnregeln | Wenn der Admin den Audit-Log öffnet | Dann wird diese Änderung klar als relevante Systemänderung erkennbar dargestellt |

## 12. Systemweite Admin-Funktionen

### US-ADM-021: Zugriff auf Admin Page schützen

**User Story**

> Als Admin möchte ich die Admin Page nur für berechtigte Benutzer zugänglich machen, damit sensible Daten und Funktionen geschützt bleiben.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Zugriff erlauben | Gegeben ein Benutzer mit Admin-Rolle ist angemeldet | Wenn der Benutzer die Admin Page öffnet | Dann erhält er Zugriff auf die Admin-Funktionen |
| AK-2 | Zugriff verweigern | Gegeben ein Benutzer ohne Admin-Rolle ist angemeldet | Wenn der Benutzer die Admin Page öffnen möchte | Dann wird der Zugriff verweigert |
| AK-3 | Nicht angemeldete Benutzer blockieren | Gegeben ein Benutzer ist nicht angemeldet | Wenn er eine Admin-Seite direkt aufruft | Dann wird er zur Anmeldung weitergeleitet |

### US-ADM-022: Systemdaten konsistent anzeigen

**User Story**

> Als Admin möchte ich konsistente Daten zwischen Admin, HR, Schichtleiter und Mitarbeiteransicht sehen, damit alle Rollen mit denselben aktuellen Informationen arbeiten.

**Akzeptanzkriterien**

| Nr. | Kriterium | Gegeben | Wenn | Dann |
|---|---|---|---|---|
| AK-1 | Aktualisierte Daten anzeigen | Gegeben der Admin ändert einen Auftrag oder Mitarbeiterdaten | Wenn eine berechtigte Rolle den betroffenen Bereich öffnet | Dann werden die aktualisierten Daten angezeigt |
| AK-2 | Veraltete Daten vermeiden | Gegeben Daten wurden geändert | Wenn ein Benutzer eine alte Ansicht neu lädt | Dann werden die aktuellen Daten aus dem System geladen |
| AK-3 | Konflikte sichtbar machen | Gegeben zwei Änderungen stehen fachlich im Konflikt | Wenn der Admin die betroffenen Daten öffnet | Dann wird der Konflikt als Hinweis angezeigt |

## 1.	Aufträge erstellen, bearbeiten, zuweisen und überwachen

## 2.	HR-Benutzer und HR-Zuständigkeiten verwalten

## 3.	Firmenkonzepte und betriebliche Regeln pflegen

## 4.	Lohn- und Stundenregeln bestimmen

## 5.	Mitarbeiter erfassen, bearbeiten und deaktivieren

## 6.	Rollen und Berechtigungen schützen

## 7.	Dashboard mit aktuellen Kennzahlen anzeigen

## 8.	Berichte, Statistiken und Rapporte auswerten

## 9.	Hinweise zu offenen oder fehlerhaften Daten anzeigen

## 10.	Suche, Filter und Sortierung in Listen ermöglichen

## 11.	Audit-Log für wichtige Änderungen bereitstellen

## Zusammenfassung der wichtigsten Admin-Bereiche

Die Admin Page soll folgende Kernbereiche abdecken:
