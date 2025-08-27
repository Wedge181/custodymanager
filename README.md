# Obsorge Doku - Custody Documentation App

Eine Full-Stack-Dokumentations-App, die für Eltern entwickelt wurde, um Aktivitäten während Obsorge-Zeiträumen zu dokumentieren. Gebaut mit Next.js, Supabase und einfacher Google OAuth-Integration.

## Features

- **Authentifizierung**: Sichere E-Mail/Passwort-Anmeldung mit Supabase Auth
- **Obsorge-Plan-Management**: Konfiguriere wiederkehrende Obsorge-Tage und -Zeiten
- **Tägliche Dokumentation**: Dokumentiere Aktivitäten, Mahlzeiten, besondere Ereignisse und lade Fotos hoch
- **Foto-Management**: Automatische GPS-Extraktion aus EXIF-Daten oder Live-Standort
- **Intelligente Vorschläge**: Vordefinierte Aktivitäten und kürzlich verwendete benutzerdefinierte Aktivitäten
- **Einfache Google OAuth**: Verbinde dein Google-Konto für zukünftige Erweiterungen
- **Datenexport**: Exportiere Einträge als PDF, JSON oder CSV
- **Progressive Web App (PWA)**: Mach die App auf mobilen Geräten installierbar
- **Push-Benachrichtigungen**: Tägliche Erinnerungen zur Dokumentation von Obsorge-Tagen

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Forms**: React Hook Form mit Zod-Validierung
- **OAuth**: Einfache Google OAuth-Integration (ohne Calendar API)
- **PWA**: Service Workers, Web Push API
- **Package Manager**: pnpm

## Voraussetzungen

- Node.js 18+ und pnpm
- Supabase-Account und -Projekt
- Google Cloud Console-Projekt (nur für OAuth, keine API-Kosten)

## Setup-Anweisungen

### 1. Klonen und Abhängigkeiten installieren

```bash
git clone <repository-url>
cd dokutoolobsorge
pnpm install
```

### 2. Umgebungskonfiguration

Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```env
# Supabase-Konfiguration
NEXT_PUBLIC_SUPABASE_URL=deine_supabase_projekt_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein_supabase_anon_key

# Google OAuth-Konfiguration (einfach, keine API-Kosten)
GOOGLE_CLIENT_ID=deine_google_client_id
GOOGLE_CLIENT_SECRET=dein_google_client_secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URL=http://localhost:3000/api/google/callback

# Push-Benachrichtigungen (Optional)
NEXT_PUBLIC_PUSH_PUBLIC_KEY=dein_vapid_public_key
PUSH_PRIVATE_KEY=dein_vapid_private_key

# App-Konfiguration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase-Setup

1. Erstelle ein neues Supabase-Projekt bei [supabase.com](https://supabase.com)
2. Gehe zu Einstellungen > API, um deine Projekt-URL und den Anon-Key zu erhalten
3. Führe das Datenbankschema im SQL-Editor aus:

```sql
-- Kopiere und füge den Inhalt von supabase-schema.sql ein
```

4. Ein Storage-Bucket namens `custody-photos` wird automatisch erstellt

### 4. Google OAuth-Setup (einfach, kostenlos)

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt oder wähle ein bestehendes aus
3. **WICHTIG**: Du musst KEINE APIs aktivieren (spart Kosten!)
4. Gehe zu Anmeldedaten > Anmeldedaten erstellen > OAuth 2.0-Client-ID
5. Setze den Anwendungstyp auf "Webanwendung"
6. Füge autorisierte Weiterleitungs-URIs hinzu:
   - `http://localhost:3000/api/google/callback` (Entwicklung)
   - `https://deine-domain.com/api/google/callback` (Produktion)
7. Kopiere die Client-ID und das Client-Secret in deine `.env.local`

### 5. Entwicklung

```bash
# Entwicklungsserver starten
pnpm dev

# Für Produktion bauen
pnpm build

# Produktionsserver starten
pnpm start
```

Die App ist verfügbar unter `http://localhost:3000`

## Datenbankschema

Die App verwendet folgende Haupttabellen:

- **`custody_schedules`**: Wiederkehrender Obsorge-Plan des Benutzers
- **`daily_entries`**: Tägliche Dokumentationseinträge
- **`entry_photos`**: Fotos, die mit Einträgen verknüpft sind
- **`google_oauth_tokens`**: Google OAuth-Token für zukünftige Erweiterungen

Alle Tabellen haben Row Level Security (RLS) aktiviert, wodurch Benutzer nur auf ihre eigenen Daten zugreifen können.

## API-Routen

- `/api/google/auth` - Startet den Google OAuth-Flow
- `/api/google/callback` - Behandelt OAuth-Callback und Token-Austausch

## PWA-Features

Die App ist als Progressive Web App konfiguriert mit:

- Installierbar auf mobilen Geräten
- Offline-Unterstützung für das Anzeigen gecachter Daten
- Push-Benachrichtigungen für tägliche Erinnerungen
- Service Worker für Hintergrund-Synchronisation

## Deployment

### Vercel (Empfohlen)

1. Pushe deinen Code zu GitHub
2. Verbinde dein Repository mit Vercel
3. Füge Umgebungsvariablen im Vercel-Dashboard hinzu
4. Deploye

### Andere Plattformen

Die App kann auf jeder Plattform bereitgestellt werden, die Next.js unterstützt:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Verwendung

1. **Registrierung/Anmeldung**: Erstelle einen Account oder melde dich an
2. **Plan konfigurieren**: Richte deinen wiederkehrenden Obsorge-Plan ein
3. **Google-Konto verbinden**: Verknüpfe dein Google-Konto (optional, für zukünftige Features)
4. **Täglich dokumentieren**: Verwende das tägliche Dokumentationsformular
5. **Daten exportieren**: Lade deine Dokumentation in verschiedenen Formaten herunter

## Kosten

**✅ Komplett kostenlos:**
- **Google OAuth**: Keine API-Kosten, nur einfache Authentifizierung
- **Supabase**: Kostenloses Tier für kleine Projekte
- **Next.js**: Open Source, kostenlos

**💰 Minimale Kosten (optional):**
- **Supabase Pro**: Ab $25/Monat für größere Projekte
- **Hosting**: Ab $5/Monat (Vercel, Netlify, etc.)

## Beitragen

1. Forke das Repository
2. Erstelle einen Feature-Branch
3. Mache deine Änderungen
4. Füge Tests hinzu, falls zutreffend
5. Reiche einen Pull Request ein

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## Support

Für Support und Fragen öffne bitte ein Issue im GitHub-Repository.

## Roadmap

- [ ] Erweiterte PDF-Export-Funktionalität
- [ ] Offline-Fotokapture und -Synchronisation
- [ ] Mehrsprachige Unterstützung
- [ ] Erweiterte Analysen und Berichte
- [ ] Integration mit anderen Kalenderdiensten
- [ ] Mobile App-Versionen (iOS/Android)
- [ ] Google Calendar-Integration (optional, kostenpflichtig)
