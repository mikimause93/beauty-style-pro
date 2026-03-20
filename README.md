# 💇 Beauty Style Pro – La Piattaforma Beauty Completa

**Versione:** 2.0.0 | **Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Supabase

---

## ✨ Funzionalità

### 🔐 Autenticazione & Profilo
- ✅ Autenticazione multi-ruolo (Cliente / Professionista / Business)
- ✅ Login via email/password e OTP SMS (stile WhatsApp)
- ✅ Recupero password via email
- ✅ Onboarding guidato al primo accesso
- ✅ Profilo modificabile con avatar upload e badge verificato
- ✅ Boost profilo e verifica account

### 🎨 Tema & UI
- ✅ Switch globale Dark/Light nell'header della home
- ✅ Tema salvato e ripristinato automaticamente tra le sessioni
- ✅ Tema neon LED con font Orbitron (v2.0.0)
- ✅ UI glassmorphism, animazioni glow, holo-border
- ✅ Controllo vocale del tema: `"tema chiaro"` / `"tema scuro"`

### 🤖 Stella AI – Assistente vocale
- ✅ Comandi vocali stile Alexa: esecuzione automatica di azioni in-app
- ✅ Wake word: dì `"Stella"` per attivare l'assistente
- ✅ Comandi supportati:
  - `"vai alla home"`, `"apri chat"`, `"apri mappa"`, `"prenota"`, `"apri shop"`
  - `"invia messaggio a [nome]: [testo]"` – invia un messaggio con contenuto specificato
  - `"metti like"` / `"dai like"` – interazione rapida
  - `"cerca match a [N] km"` – ricerca sulla mappa intelligente
  - `"tema chiaro"` / `"tema scuro"` – cambio tema vocale
  - `"dimmi le notifiche"`, `"conferma prenotazione"`, `"aggiungi [nome]"`, e molti altri

### 🤖 AI Look Generator
- ✅ Generazione look personalizzati tramite intelligenza artificiale
- ✅ Pagina dedicata `/ai-look` con suggerimenti di stile

### 💬 Chat & Comunicazione
- ✅ Chat stile Messenger/WhatsApp con messaggi testuali, immagini, file, vocali
- ✅ Traduzione in tempo reale dei messaggi in arrivo (rileva lingua automaticamente)
- ✅ Chiamate vocali e video in-app
- ✅ Registrazione messaggi vocali con Media Recorder API
- ✅ Pulsante WhatsApp per contatto rapido esterno

### 🔔 Notifiche
- ✅ Notifiche push attive anche ad app chiusa tramite Service Worker
- ✅ Notifiche stile social: like, commenti, messaggi, prenotazioni, follower
- ✅ Click sulla notifica apre direttamente il contenuto rilevante
- ✅ Promemoria (`/reminders`) personalizzati

### 📅 Prenotazioni & Servizi
- ✅ Prenotazioni con selezione data, orario e luogo
- ✅ Storico prenotazioni con dettaglio e stato
- ✅ Servizi a domicilio (`/home-service`)
- ✅ Dettaglio servizio con prenotazione diretta
- ✅ Recensioni post-servizio
- ✅ Ricevute e pagamenti rateali (`/installments`, `/receipts`)
- ✅ Checkout integrato con wallet virtuale

### 🗺️ Esplora & Ricerca
- ✅ Pagina Explore con feed personalizzato
- ✅ Ricerca su mappa intelligente AI (`/map-search`)
- ✅ Lista stilisti e professionisti con filtri
- ✅ Spa & Terme (`/spa-terme`)
- ✅ Offerte e sconti (`/offers`)

### 📱 Social & Feed
- ✅ Feed social con like, commenti, condivisioni
- ✅ Shorts video stile TikTok (`/shorts`)
- ✅ Sistema Follow / Unfollow in tempo reale
- ✅ Gallery Before/After (`/before-after`)
- ✅ Creazione post con media

### 🎬 Live & Entertainment
- ✅ Live Streaming con reactions, chat e tips QRCoin (`/live`)
- ✅ Go Live con trasmissione in diretta (`/go-live`)
- ✅ Live Battle tra professionisti (`/live-battle`)
- ✅ Quiz Live interattivo (`/quiz-live`)
- ✅ Talent Game (`/talent-game`)
- ✅ Transformation Challenge (`/transformation-challenge`)
- ✅ Radio & Music Player integrato (`/radio`)

### 🎮 Gamification & Reward
- ✅ Spin & Win ruota premi (`/spin`)
- ✅ Challenges settimanali (`/challenges`)
- ✅ Missioni giornaliere (`/missions`)
- ✅ Leaderboard globale (`/leaderboard`)
- ✅ Sistema QRCoin: guadagna e spendi coin in-app (`/qr-coins`)
- ✅ Programma referral con link univoco (`/referral`)
- ✅ Programma affiliazione (`/affiliate`)

### 🛍️ E-commerce & Marketplace
- ✅ Shop prodotti beauty (`/shop`)
- ✅ Marketplace lavori & servizi (`/marketplace`)
- ✅ Richieste di servizio personalizzate
- ✅ Casting beauty & talent
- ✅ Aste prodotti beauty (`/auctions`)
- ✅ Gestione prodotti (per Business) (`/manage-products`)
- ✅ Wallet virtuale con storico transazioni (`/wallet`)
- ✅ Storico acquisti (`/purchases`)

### 👔 Business & HR
- ✅ Dashboard Business con analytics avanzati
- ✅ Gestione team con turni e attività (`/business/team`)
- ✅ Pubblicazione annunci di lavoro HR (`/hr`)
- ✅ Dashboard del Professionista (`/professional-dashboard`)
- ✅ Subscriptions e piani a pagamento (`/subscriptions`)
- ✅ Analytics dashboard completa (`/analytics`)

### 🛡️ Admin & Sicurezza
- ✅ Pannello Admin (`/admin`)
- ✅ Debug panel per sviluppatori (`/debug`)
- ✅ ErrorBoundary con fallback UI
- ✅ Storage sicuro con safeStorage utility

### 📲 PWA & Mobile
- ✅ PWA installabile su iOS e Android
- ✅ App Android con Capacitor (build `.aab` per Google Play)
- ✅ Service Worker per notifiche push offline
- ✅ Splash Screen e icone native

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

**Setup una tantum:**
1. Vai su **Settings → Pages** del repository
2. In *Source* seleziona **GitHub Actions**
3. Aggiungi i seguenti segreti in **Settings → Secrets and variables → Actions**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
4. Il sito sarà disponibile all'URL mostrato nel tab *Pages* (es. `https://<utente>.github.io/beauty-style-pro/`)

Per testare il build web in locale:

```bash
npm run build      # genera la cartella dist/
npm run preview    # anteprima locale del build su http://localhost:4173
```

### 🤖 Android – Google Play (AAB)

Il workflow **Build & Publish Android to Play Store** (`.github/workflows/android.yml`) genera un bundle `.aab` firmato e lo pubblica automaticamente sul Play Store (internal testing track).

**Setup una tantum:**
1. Genera un keystore di firma:
   ```bash
   keytool -genkey -v -keystore stayle.keystore -alias style-beauty \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Converti il keystore in Base64:
   ```bash
   base64 stayle.keystore | tr -d '\n'
   ```
3. Aggiungi i segreti in **Settings → Secrets and variables → Actions**:

   | Secret | Descrizione |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | Keystore in Base64 |
   | `ANDROID_KEY_ALIAS` | Alias chiave (es. `style-beauty`) |
   | `ANDROID_STORE_PASSWORD` | Password keystore |
   | `ANDROID_KEY_PASSWORD` | Password chiave |
   | `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | JSON del Service Account Google Play (per la pubblicazione automatica) |

4. Per il Service Account Google Play: vai su Google Play Console → Setup → API access → crea un account di servizio con ruolo *Release manager*
5. Se `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` non è impostato, il workflow salva l'AAB come artefatto scaricabile (skip silenzioso della pubblicazione)
6. Per cambiare track (`internal` → `alpha` / `beta` / `production`), modifica il campo `track:` in `.github/workflows/android.yml`

---

## 🔗 Connessione GitHub

Sì, **questo repository è connesso a GitHub** ed è possibile apportare modifiche tramite:

- **[Lovable.dev](https://lovable.dev)** – modifiche visive e AI direttamente sincronizzate sul repository tramite commit automatici
- **GitHub Copilot Agent** – modifiche automatizzate tramite agenti AI GitHub (pull request automatiche)
- **Pull Request classica** – contributi diretti creando un branch e aprendo una PR su `main`

Ogni modifica su `main` attiva automaticamente:

| Workflow | File | Azione |
|---|---|---|
| CI – Lint & Test | `.github/workflows/ci.yml` | Esegue lint e test su ogni push e PR |
| Deploy – GitHub Pages | `.github/workflows/deploy.yml` | Pubblica l'app su GitHub Pages |
| Build & Publish Android | `.github/workflows/android.yml` | Genera e pubblica l'AAB sul Play Store |

---

Creato con [Lovable](https://lovable.dev)
