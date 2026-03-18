# Security Policy

## Versioni supportate

| Versione | Supportata         |
| -------- | ------------------ |
| 1.0.x    | :white_check_mark: |

## Segnalare una vulnerabilità

Se scopri una vulnerabilità di sicurezza in questo progetto, ti chiediamo di **non aprire una issue pubblica**.

Puoi segnalarla in modo responsabile aprendo una **Security Advisory privata** direttamente su GitHub:

1. Vai alla scheda **Security** del repository
2. Clicca su **"Report a vulnerability"**
3. Descrivi in dettaglio il problema, i passi per riprodurlo e l'impatto potenziale

Risponderemo entro **5 giorni lavorativi** con una valutazione iniziale. Se la vulnerabilità viene confermata, rilasceremo una patch e aggiorneremo questo documento.

## Note di sicurezza

- Tutte le variabili d'ambiente sensibili (chiavi Supabase, Stripe, ecc.) devono essere configurate tramite file `.env` (escluso da `.gitignore`) in locale e tramite le impostazioni di environment del provider di deployment (es. Vercel). Per la CI/CD usa i **GitHub Secrets**. Non hardcodarle mai nel codice.
- Le chiavi pubbliche (`VITE_SUPABASE_PUBLISHABLE_KEY`) sono sicure lato client; non condividere mai la **Service Role Key** di Supabase.
- Le transazioni di pagamento sono gestite tramite **Stripe** con comunicazione server-side; nessuna chiave segreta Stripe è esposta al client.
