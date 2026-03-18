# 💇 STYLE – La Piattaforma Beauty Completa

**Versione:** 2.0.0 | **Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Supabase + Capacitor

> PWA installabile e app nativa iOS/Android per la community beauty italiana.

---

## ✨ Funzionalità

### Core
- ✅ Autenticazione multi-ruolo (Cliente / Professionista / Business)
- ✅ Autenticazione tramite numero di telefono (OTP SMS, stile WhatsApp)
- ✅ Recupero password via e-mail con link di reset
- ✅ Feed social con like, commenti, condivisioni
- ✅ Sistema Follow / Unfollow in tempo reale
- ✅ Notifiche real-time e push (anche ad app chiusa, via Service Worker)
- ✅ Chat stile Messenger/WhatsApp con messaggi vocali e traduzione in tempo reale
- ✅ Prenotazioni con selezione data, orario e luogo
- ✅ Profilo modificabile con avatar upload
- ✅ Shorts – video brevi stile TikTok
- ✅ Before/After gallery – trasformazioni prima/dopo
- ✅ Galleria eventi beauty locali
- ✅ Spa & Terme – directory centri benessere

### Tema Dark / Light
- ✅ Switch globale Dark/Light direttamente nell'header della home
- ✅ Il tema viene salvato e ripristinato automaticamente tra le sessioni
- ✅ Tema scuro (nero, default) e chiaro (bianco, stile Instagram)
- ✅ Controllo vocale del tema: "tema chiaro" / "tema scuro"

### Stella AI – Assistente vocale e Chatbot
- ✅ Comandi vocali stile Alexa: esecuzione automatica di azioni in-app
- ✅ Wake word: dì "Stella" per attivare l'assistente
- ✅ Chatbot widget flottante disponibile in ogni schermata
- ✅ Comandi supportati:
  - `"vai alla home"`, `"apri chat"`, `"apri mappa"`, `"prenota"`, `"apri shop"`
  - `"invia messaggio a [nome]: [testo]"` – invia un messaggio con contenuto specificato
  - `"metti like"` / `"dai like"` – interazione rapida
  - `"cerca match a [N] km"` – ricerca sulla mappa intelligente
  - `"tema chiaro"` / `"tema scuro"` – cambio tema vocale
  - `"dimmi le notifiche"`, `"conferma prenotazione"`, `"aggiungi [nome]"`, e molti altri
- ✅ AI Look Generator – genera look beauty personalizzati con l'AI

### Chat avanzata
- ✅ Chat stile Messenger/WhatsApp con messaggi testuali, immagini, file, vocali
- ✅ Traduzione in tempo reale dei messaggi in arrivo (rileva lingua automaticamente)
- ✅ Chiamate vocali e video in-app
- ✅ Registrazione messaggi vocali con Media Recorder API

### Notifiche Push
- ✅ Notifiche push attive anche ad app chiusa tramite Service Worker
- ✅ Notifiche stile social: like, commenti, messaggi, prenotazioni, follower
- ✅ Click sulla notifica apre direttamente il contenuto rilevante
- ✅ Centro notifiche dedicato con badge aggiornato in tempo reale

### Business & HR
- ✅ Dashboard Business con analytics avanzate
- ✅ Gestione team: inviti, turni e log attività dei dipendenti
- ✅ Gestione annunci di lavoro (HR): crea e gestisci offerte, gestisci candidature
- ✅ Profilo Business con servizi, shop e recensioni
- ✅ Dashboard Professionista con statistiche personali

### Entertainment & Gamification
- ✅ Live Streaming con reactions, chat e tips (QRCoin)
- ✅ Live Battle – sfide in diretta tra creator
- ✅ Quiz Live – quiz interattivi in tempo reale
- ✅ Talent Game – scoperta e promozione dei talenti
- ✅ Transformation Challenge – sfida di trasformazione beauty
- ✅ Radio & Music Player integrato
- ✅ Spin & Win – ruota premi giornaliera
- ✅ Challenges & Leaderboard – sfide community con classifica
- ✅ Daily Missions – missioni giornaliere con ricompense
- ✅ Sistema QRCoin e Programma referral
- ✅ Programma affiliati

### E-commerce & Pagamenti
- ✅ Shop prodotti beauty con checkout
- ✅ Dettaglio servizi con prenotazione diretta
- ✅ Aste – offerte su prodotti/servizi beauty
- ✅ Offerte promozionali
- ✅ Wallet digitale per acquisti e pagamenti
- ✅ Piani a rate (installment) per acquisti di importo elevato
- ✅ Storico acquisti e ricevute digitali
- ✅ Pagamenti tramite Stripe (Edge Function dedicata)

### Marketplace & Promozione
- ✅ Marketplace richieste/casting beauty
- ✅ Boost profilo – aumenta la visibilità del proprio profilo
- ✅ Abbonamenti Premium – funzionalità avanzate per professionisti
- ✅ Creator Program – diventa creator sulla piattaforma

### Sicurezza & Impostazioni
- ✅ Verifica account per professionisti e business
- ✅ Smart Reminders – promemoria intelligenti per appuntamenti
- ✅ Impostazioni utente complete
- ✅ Gestione errori centralizzata con messaggi localizzati in italiano
- ✅ ErrorBoundary globale per la gestione sicura dei crash dell'interfaccia
- ✅ Ricerca su mappa intelligente AI con geolocalizzazione
- ✅ PWA installabile su iOS e Android

---

## 🗺️ Pagine e Route

| Route | Descrizione |
|---|---|
| `/` | Home – feed e scoperta |
| `/auth` | Accesso / Registrazione (OTP telefono) |
| `/onboarding` | Onboarding nuovo utente |
| `/explore` | Esplora contenuti |
| `/search` | Ricerca |
| `/stylists` | Directory stilisti |
| `/stylist/:id` | Profilo stilista |
| `/service/:id` | Dettaglio servizio |
| `/business/:id` | Profilo business |
| `/shop` | Shop prodotti beauty |
| `/live` | Live streaming |
| `/radio` | Radio & music player |
| `/shorts` | Video brevi |
| `/map-search` | Mappa intelligente AI |
| `/spa-terme` | Directory spa & terme |
| `/offers` | Offerte promozionali |
| `/auctions` | Aste |
| `/events` | Eventi beauty |
| `/before-after` | Galleria prima/dopo |
| `/profile` | Profilo personale |
| `/profile/:id` | Profilo di un altro utente |
| `/profile/edit` | Modifica profilo |
| `/booking` | Nuova prenotazione |
| `/booking/:id` | Prenota un servizio specifico |
| `/my-bookings` | Le mie prenotazioni |
| `/my-bookings/:id` | Dettaglio prenotazione |
| `/my-bookings/:id/review` | Lascia una recensione |
| `/chat` | Messaggi |
| `/chat/:id` | Conversazione con un utente |
| `/notifications` | Centro notifiche |
| `/home-service/:id` | Servizio a domicilio |
| `/settings` | Impostazioni |
| `/referral` | Programma referral |
| `/analytics` | Dashboard analytics |
| `/installments` | Piani a rate |
| `/purchases` | Storico acquisti |
| `/receipts` | Ricevute |
| `/qr-coins` | Wallet QRCoin |
| `/challenges` | Sfide & classifiche |
| `/spin` | Spin & Win |
| `/leaderboard` | Classifica |
| `/missions` | Missioni giornaliere |
| `/reminders` | Smart reminders |
| `/ai-assistant` | Assistente Stella AI |
| `/ai-look` | AI Look Generator |
| `/go-live` | Avvia live streaming |
| `/live-battle` | Live battle |
| `/quiz-live` | Quiz live |
| `/talent-game` | Talent game |
| `/transformation-challenge` | Transformation challenge |
| `/manage-products` | Gestione prodotti shop |
| `/wallet` | Wallet digitale |
| `/subscriptions` | Abbonamenti Premium |
| `/boost` | Boost profilo |
| `/become-creator` | Diventa creator |
| `/marketplace` | Marketplace richieste/casting |
| `/marketplace/create-request` | Crea richiesta |
| `/marketplace/create-casting` | Crea casting |
| `/checkout` | Checkout pagamento |
| `/verify-account` | Verifica account |
| `/affiliate` | Programma affiliati |
| `/professional-dashboard` | Dashboard professionista |
| `/business` | Dashboard business |
| `/business/team` | Gestione team |
| `/business/team/invite` | Invita membro del team |
| `/business/team/shifts` | Turni dipendenti |
| `/business/team/activity` | Log attività dipendenti |
| `/hr` | HR – gestione lavoro |
| `/hr/create-job` | Pubblica offerta di lavoro |
| `/hr/job/:id` | Dettaglio offerta |
| `/hr/job/:id/manage` | Gestisci offerta |
| `/hr/application/:id` | Dettaglio candidatura |
| `/admin` | Pannello admin |
| `/terms` | Termini di servizio |
| `/privacy` | Privacy policy |

---

## 🛠️ Stack tecnologico

| Categoria | Tecnologia |
|---|---|
| Framework UI | React 18.3 + TypeScript 5.8 |
| Build tool | Vite 5.4 + @vitejs/plugin-react-swc |
| Stile | Tailwind CSS 3.4 + Radix UI + Framer Motion 12 |
| Icone | Lucide React |
| Routing | React Router DOM 6 |
| Stato server | TanStack React Query 5 |
| Form | React Hook Form 7 + Zod |
| Backend/DB | Supabase (PostgreSQL + Realtime) |
| Auth | Supabase Auth (OTP telefono, email/password, reset password) |
| Mappe | Leaflet + react-leaflet |
| Grafici | Recharts |
| Pagamenti | Stripe (via Supabase Edge Functions) |
| App mobile | Capacitor 8 (iOS + Android) |
| PWA | Service Worker nativo |
| Toast | Sonner |
| Date | date-fns |
| QR code | qrcode.react |
| Tema | next-themes |
| Test | Vitest 3 + @testing-library/react |
| Linting | ESLint 9 + typescript-eslint |
| Performance | @vercel/speed-insights |
| Deploy web | GitHub Pages / Vercel |
| Deploy mobile | Google Play Store (AAB firmato) |

---

## 🚀 Sviluppo locale

```bash
npm install
npm run dev        # server di sviluppo su http://localhost:8080
```

### Variabili d'ambiente

Copia `.env.example` in `.env` e compila i valori:

```bash
cp .env.example .env
```

| Variabile | Descrizione |
|---|---|
| `VITE_SUPABASE_URL` | URL del tuo progetto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/public key Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID progetto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo Edge Functions) |
| `STRIPE_SECRET_KEY` | Secret key Stripe (solo Edge Functions) |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret Stripe (solo Edge Functions) |

---

## 🧪 Test

### Eseguire i test in locale

```bash
npm test               # esegui tutti i test una sola volta
npm run test:watch     # esegui i test in modalità watch
npm run lint           # lint del codice sorgente
npm run build          # build di produzione
```

Test inclusi:
- `useTheme.test.ts` – tema predefinito, ripristino da localStorage, toggle, variabili CSS
- `voiceCommands.test.ts` – pattern matching comandi vocali (navigazione, messaggi, like, mappa, tema)

### CI automatica

Ogni push o Pull Request verso `main` esegue automaticamente lint e test tramite il workflow **CI – Lint & Test** (`.github/workflows/ci.yml`).

---

## 📱 Autenticazione telefono (OTP)

Per abilitare l'autenticazione tramite numero di telefono:

1. Nel [pannello Supabase](https://app.supabase.com) → **Authentication → Providers** → abilita **Phone**
2. Configura un provider SMS (Twilio, MessageBird, ecc.) nelle impostazioni Supabase
3. L'utente inserisce il numero (es. `+39 333 123 4567`) → riceve un OTP via SMS → accede

Per il recupero password via e-mail:

1. Nel pannello Supabase → **Authentication → Email Templates** → personalizza il template *Reset Password*
2. Configura `Site URL` in **Authentication → URL Configuration** con l'URL della tua app
3. L'utente clicca "Password dimenticata?" in `/auth` → riceve un link di reset via e-mail

---

## 📦 Pubblicare l'app

### 🌐 Web – GitHub Pages

Il workflow **Deploy – GitHub Pages** (`.github/workflows/deploy.yml`) si attiva automaticamente ad ogni push su `main`.

**Setup una tantum:**
1. Vai su **Settings → Pages** del repository
2. In *Source* seleziona **GitHub Actions**
3. Aggiungi i segreti in **Settings → Secrets and variables → Actions**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
4. Il sito sarà disponibile su `https://<utente>.github.io/beauty-style-pro/`

```bash
npm run build      # genera dist/
npm run preview    # anteprima locale su http://localhost:4173
```

### ☁️ Web – Vercel

In alternativa a GitHub Pages, il file `vercel.json` è già configurato per il deploy su Vercel. Collega il repository su [vercel.com](https://vercel.com) e imposta le stesse variabili d'ambiente.

### 🤖 Android – Google Play (AAB)

Il workflow **Build & Publish Android to Play Store** (`.github/workflows/android.yml`) genera un bundle `.aab` firmato e lo pubblica automaticamente sul Play Store (internal testing track).

**Setup una tantum:**
1. Genera un keystore di firma:
   ```bash
   keytool -genkey -v -keystore style.keystore -alias style-beauty \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Converti il keystore in Base64:
   ```bash
   base64 style.keystore | tr -d '\n'
   ```
3. Aggiungi i segreti in **Settings → Secrets and variables → Actions**:

   | Secret | Descrizione |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | Keystore in Base64 |
   | `ANDROID_KEY_ALIAS` | Alias chiave (es. `style-beauty`) |
   | `ANDROID_STORE_PASSWORD` | Password keystore |
   | `ANDROID_KEY_PASSWORD` | Password chiave |
   | `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | JSON Service Account Google Play |

4. Per il Service Account: Google Play Console → Setup → API access → crea account di servizio con ruolo *Release manager*
5. Se `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` non è impostato, il workflow salva l'AAB come artefatto scaricabile
6. Per cambiare track (`internal` → `alpha` / `beta` / `production`), modifica `track:` in `.github/workflows/android.yml`

---

## 🔗 Workflow GitHub Actions

| Workflow | File | Attivazione |
|---|---|---|
| CI – Lint & Test | `.github/workflows/ci.yml` | Ogni push e PR su `main` |
| Deploy – GitHub Pages | `.github/workflows/deploy.yml` | Ogni push su `main` |
| Build & Publish Android | `.github/workflows/android.yml` | Ogni push su `main` |

---

## 🔗 Contribuire

Puoi contribuire al progetto tramite:

- **[Lovable.dev](https://lovable.dev)** – modifiche visive e AI sincronizzate automaticamente via commit
- **GitHub Copilot Agent** – pull request automatizzate tramite agenti AI GitHub
- **Pull Request classica** – crea un branch, apporta le modifiche e apri una PR su `main`

---

Creato con [Lovable](https://lovable.dev)
