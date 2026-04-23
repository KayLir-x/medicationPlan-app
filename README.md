# MedPlaner – Patienten- & Medikationsverwaltung

Fullstack Webanwendung zur Verwaltung von Patienten und wöchentlichen Medikamentenplänen mit Authentifizierung und geschützten API-Endpunkten.

---

## Projektübersicht

MedPlaner ist eine webbasierte Anwendung, mit der Nutzer Patienten anlegen und für jeden Patienten individuelle Medikamentenpläne verwalten können.

Die Anwendung bietet eine strukturierte Wochenansicht und ermöglicht das Erstellen, Bearbeiten und Löschen von Einträgen in Echtzeit.

 Ziel: Vereinfachung und Strukturierung von Medikationsabläufen.

---

## Features

- Benutzerregistrierung & Login (JWT Auth)
- Patientenverwaltung (CRUD)
- Wochenplan für Medikamenteneinnahmen
- Einträge erstellen, bearbeiten, löschen
- Filter & Sortierung von Daten
- Fehler- und Statusmeldungen im UI
- Zugriff nur auf eigene Daten (geschützte API)

---

## Tech Stack

### Frontend
- React
- React Router
- JavaScript
- CSS

### Backend
- Node.js
- Express
- JWT (Authentifizierung)
- bcrypt (Passwort-Hashing)

### Datenhaltung
- JSON-Dateien (für Demo-Zwecke)

---

## Sicherheit

- Passwort-Hashing mit bcrypt
- JWT-basierte Authentifizierung
- Geschützte API-Routen
- Benutzerbezogene Datenzugriffe

---

## Screenshots

*(Hier Screenshots einfügen)*  
- Login  
- Patientenliste  
- Wochenplan  

---

## Installation

### 1. Repository klonen
```bash
git clone <https://github.com/KayLir-x/medicationPlan-app.git>