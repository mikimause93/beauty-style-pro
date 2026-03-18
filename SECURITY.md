# Security Policy

## Versioni supportate

| Versione | Supportata         |
| -------- | ------------------ |
| 2.0.x    | :white_check_mark: |
| 1.0.x    | :x:                |

## Segnalare una vulnerabilità

Se scopri una vulnerabilità di sicurezza in **STYLE – La Piattaforma Beauty Completa**, ti chiediamo di segnalarla in modo responsabile.

### Come segnalare

1. **Non aprire una Issue pubblica** se la vulnerabilità potrebbe esporre dati sensibili degli utenti.
2. Apri una [GitHub Security Advisory](https://github.com/mikimause93/beauty-style-pro/security/advisories/new) (privata) oppure contatta il maintainer direttamente tramite il profilo GitHub [@mikimause93](https://github.com/mikimause93).
3. Includi nella segnalazione:
   - Descrizione della vulnerabilità
   - Passi per riprodurla
   - Impatto potenziale
   - Eventuale proposta di fix

### Tempi di risposta

- **Conferma ricezione:** entro 3 giorni lavorativi
- **Aggiornamento sullo stato:** entro 7 giorni lavorativi
- **Fix o mitigazione:** entro 30 giorni dalla conferma (in base alla gravità)

### Scope

Questa policy riguarda il codice presente in questo repository, inclusi:

- Frontend React/TypeScript (`src/`)
- Supabase Edge Functions (`supabase/functions/`)
- Workflow GitHub Actions (`.github/workflows/`)
- Configurazione Capacitor/Android (`android/`, `capacitor.config.ts`)

Non rientrano nello scope le vulnerabilità dei servizi di terze parti (Supabase, Stripe, Google Play) che devono essere segnalate direttamente ai rispettivi vendor.

### Ringraziamenti

I ricercatori di sicurezza che segnalano vulnerabilità valide in modo responsabile saranno citati nel changelog della release che include il fix (salvo richiesta di anonimato).

