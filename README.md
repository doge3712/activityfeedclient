# Activity Feed Client (inoffiziell)

Ein kleiner Desktop-Client für Streamer: Er zeigt Spenden und Twitch-Aktivitäten (Subs, Resubs, Gift Subs, Follows, Bits, Raids) in einer Übersicht an. Kein Chat, nur der Aktivitätsfeed. Mit Suche nach Benutzernamen, Filtern und verschiebbarer Aufteilung zwischen Spenden und Twitch.

> **Inoffizielles Fan-Projekt.** Nicht verbunden mit, unterstützt oder gesponsert von Twitch, StreamElements, Streamlabs oder Tipeeestream. Alle Namen gehören ihren jeweiligen Inhabern.
> **Beta:** Getestet sind bisher Twitch und StreamElements. Streamlabs und Tipeeestream wurden nach der Dokumentation gebaut, aber noch nicht ausführlich getestet.

## Download
Fertige Windows-Version unter **Releases** (rechts auf der Repository-Seite).
Windows zeigt bei nicht signierten Programmen evtl. eine SmartScreen-Warnung: „Weitere Informationen" und dann „Trotzdem ausführen".

## Verbinden
Öffne oben **Client**:

- **Twitch:** „Mit Twitch anmelden". Der Browser öffnet sich, du klickst auf „Autorisieren". Es werden nur Leserechte angefragt (`channel:read:subscriptions`, `moderator:read:followers`, `bits:read`).
- **StreamElements:** JWT-Token (Dashboard, Avatar oben rechts, deinen Kanal wählen, Token kopieren).
- **Streamlabs:** Socket-API-Token (streamlabs.com, Dashboard, API-Einstellungen).
- **Tipeeestream:** API-Key und Benutzername aus deinem Account.

Tokens und API-Keys sind wie Passwörter: nie weitergeben. Sie werden nur verschlüsselt auf deinem Rechner gespeichert, nie hochgeladen.

## Eigene Twitch-Client-ID (optional)
Du kannst eine eigene Twitch-App verwenden:
1. dev.twitch.tv/console/apps, „Anwendung registrieren"
2. Client-Typ **Öffentlich (Public)**, OAuth-Redirect-URL `http://localhost`
3. Client-ID im Client unter **Client** eintragen, speichern und neu anmelden.

## Selbst starten / bauen
Voraussetzung: Node.js
```
npm install
npm start        # starten
npm run dist     # Windows-Installer bauen (Ordner dist)
```

## Lizenz
MIT, siehe LICENSE.
