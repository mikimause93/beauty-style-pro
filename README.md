# 💇 STYLE - La Piattaforma Beauty Completa

**Versione:** 1.0.0 | **Stack:** React + Vite + TypeScript + Tailwind CSS + Lovable Cloud

---

## ✨ Funzionalità

### Core
- ✅ Autenticazione multi-ruolo (Cliente / Professionista / Business)
- ✅ Feed social con like, commenti, condivisioni
- ✅ Sistema Follow / Unfollow in tempo reale
- ✅ Notifiche real-time
- ✅ Chat e messaggistica
- ✅ Prenotazioni con selezione data, orario e luogo
- ✅ Profilo modificabile con avatar upload

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
- ✅ Impostazioni utente, Recensioni, Ricerca su mappa

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

### CI automatica

Ogni push o Pull Request verso `main` esegue automaticamente lint e test tramite il workflow **CI – Lint & Test** (`.github/workflows/ci.yml`).

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

Il workflow **Build Android AAB** (`.github/workflows/android.yml`) genera un bundle `.aab` pronto per il Google Play Store.

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
   - `ANDROID_KEYSTORE_BASE64` – output del comando sopra
   - `ANDROID_KEY_ALIAS` – alias usato nella creazione (es. `style-beauty`)
   - `ANDROID_STORE_PASSWORD` – password del keystore
   - `ANDROID_KEY_PASSWORD` – password della chiave
4. Fai un push su `main`: il file `.aab` verrà caricato come artefatto del workflow, scaricabile dalla pagina **Actions → Build Android AAB → Artifacts**
5. Carica il file `.aab` sulla [Google Play Console](https://play.google.com/console) per la distribuzione

---

Creato con [Lovable](https://lovable.dev)
