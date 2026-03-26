# 💇 Beauty Style Pro — Piattaforma Beauty Enterprise

[![CI](https://github.com/mikimause93/beauty-style-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/mikimause93/beauty-style-pro/actions/workflows/ci.yml)
[![Security Scan](https://github.com/mikimause93/beauty-style-pro/actions/workflows/security-scan.yml/badge.svg)](https://github.com/mikimause93/beauty-style-pro/actions/workflows/security-scan.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

**Versione:** 3.0.0 ENTERPRISE | **Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Supabase

---

## 2.0.0 — Novità

- Aggiornamento versione a 2.0.0.
- Aggiunto file di compatibilità Lovable: `beauty_style_pro.md` (linee guida per modifiche sicure e preview).
- Migliorata la compatibilità con l'ambiente Lovable Preview per evitare rotture in fase di editing e preview live.
- Bump versione `package.json` a `2.0.0`.
- Varie correzioni e refactor minori apportati tramite commit recenti (fix runtime, miglioramenti tipi TypeScript e stabilità).
- Aggiornamento delle dipendenze e devDependencies (vedi `package.json` per dettagli).
- Nota: il changelog è stato generato automaticamente dai commit e potrebbe essere incompleto; per la lista completa vedi: https://github.com/mikimause93/beauty-style-pro/commits

---

## ✨ Funzionalità

### Core

- ✅ Autenticazione multi-ruolo (Cliente / Professionista / Business)
- ✅ Autenticazione tramite numero di telefono (OTP SMS, stile WhatsApp)
- ✅ Feed social con like, commenti, condivisioni
- ✅ Sistema Follow / Unfollow in tempo reale
- ✅ Notifiche real-time e push (anche ad app chiusa, via Service Worker)
- ✅ Chat stile Messenger/WhatsApp con messaggi vocali e traduzione in tempo reale
- ✅ Prenotazioni con selezione data, orario e luogo
- ✅ Profilo modificabile con avatar upload

### Tema Dark / Light

- ✅ Switch globale Dark/Light direttamente nell'header della home
- ✅ Il tema viene salvato e ripristinato automaticamente tra le sessioni
- ✅ Tema scuro (nero, default) e chiaro (bianco, stile Instagram)
- ✅ Controllo vocale del tema: "tema chiaro" / "tema scuro"

### Stella AI – Assistente vocale

- ✅ Comandi vocali stile Alexa: esecuzione automatica di azioni in-app
- ✅ Wake word: dì "Stella" per attivare l'assistente
- ✅ Comandi supportati:
  - "vai alla home", "apri chat", "apri mappa", "prenota", "apri shop"
  - "invia messaggio a [nome]: [testo]" – invia un messaggio con contenuto specificato
  - "metti like" / "dai like" – interazione rapida
  - "cerca match a [N] km" – ricerca sulla mappa intelligente
  - "tema chiaro" / "tema scuro" – cambio tema vocale
  - "dimmi le notifiche", "conferma prenotazione", "aggiungi [nome]" e altri

### Chat avanzata

- ✅ Chat stile Messenger/WhatsApp con messaggi testuali, immagini, file, vocali
- ✅ Traduzione in tempo reale dei messaggi in arrivo (rileva lingua automaticamente)
- ✅ Chiamate vocali e video in-app
- ✅ Registrazione messaggi vocali con Media Recorder API

### Notifiche Push

- ✅ Notifiche push attive anche ad app chiusa tramite Service Worker
- ✅ Notifiche stile social: like, commenti, messaggi, prenotazioni, follower
- ✅ Click sulla notifica apre direttamente il contenuto rilevante

### Business & HR

- ✅ Dashboard Business con analytics
- ✅ Gestione annunci di lavoro (HR)
- ✅ Profilo Business con servizi, shop e recensioni

### Entertainment & Gamification

- ✅ Live Streaming con reactions, chat e tips (QRCoin)
- ✅ Radio & Music Player integrato
- ✅ Spin & Win, Challenges, Leaderboard
- ✅ Sistema QRCoin e Programma referral

### E-commerce & Altro

- ✅ Shop prodotti beauty
- ✅ Dettaglio servizi con prenotazione diretta
- ✅ Before/After gallery, Eventi, PWA installabile
- ✅ Impostazioni utente, Recensioni, Ricerca su mappa intelligente AI

---

## 🚀 Sviluppo locale

```bash
npm install
npm run dev        # avvia il server di sviluppo su http://localhost:8080
```

---

## 🧪 Test

### Eseguire i test in locale

```bash
npm test           # esegui tutti i test una sola volta
npm run test:watch # esegui i test in modalità watch (rieseguiti ad ogni modifica)
```

Test inclusi:

- `useTheme.test.ts` – default theme, localStorage restore, toggle, CSS variables
- `voiceCommands.test.ts` – pattern matching comandi vocali (navigazione, messaggi, like, mappa, tema)

### CI automatica

Ogni push o Pull Request verso `main` esegue automaticamente lint e test tramite il workflow **CI – Lint & Test** (`.github/workflows/ci.yml`).

---

## 📱 Autenticazione telefono (OTP)

Per abilitare l'autenticazione tramite numero di telefono (stile WhatsApp):

1. Nel [pannello Supabase](https://app.supabase.com) → **Authentication → Providers** → abilita **Phone**
2. Configura un provider SMS (Twilio, MessageBird, ecc.) nelle impostazioni Supabase
3. L'utente inserisce il numero (es. `+39 333 123 4567`) → riceve un OTP via SMS → accede

---

## 📦 Pubblicare l'app

### 🌐 Web – GitHub Pages

Il workflow **Deploy – GitHub Pages** (`.github/workflows/deploy.yml`) si attiva automaticamente ad ogni push su `main` e pubblica il build su GitHub Pages.

(segue il contenuto esistente: istruzioni build, android aab, secrets, CI, ecc. mantenute invariate)
