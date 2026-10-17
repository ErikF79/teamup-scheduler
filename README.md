# TeamUp Scheduler

PWA per la **pianificazione degli orari di allenamento** delle società sportive:
palestre, squadre, allenatori e disponibilità, con planner visuale, dashboard di
carico e stampe/PDF.

**App online:** https://erikf79.github.io/teamup-scheduler/

## Caratteristiche

- **Local-first**: tutti i dati restano nel browser (`localStorage`), nessun backend,
  funzionamento offline tramite service worker.
- **Admin Panel**: gestione di palestre, squadre, coach, disponibilità e più scenari
  (configurazioni) salvati, con import/export e backup.
- **Scheduler**: assegnazione visuale degli allenamenti a fasce orarie e campi.
- **Dashboard**: statistiche e grafici sul carico di lavoro di squadre e coach.
- **Stampa**: report tabellari o grafici ottimizzati per stampa/PDF.
- **UI responsive**: layout adattivo (sidebar su desktop, bottom-nav su mobile),
  tema chiaro/scuro/sistema.

Vedi il [Manuale Utente](MANUALE_UTENTE.md) per la guida completa.

## Stack

Next.js 15 (App Router, export statico) · React 18 · TypeScript · Tailwind CSS ·
shadcn/ui (Radix). Pubblicato su GitHub Pages via GitHub Actions.

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:9002
```

Avvio rapido su Windows: fai doppio clic su `Avvia-App-Test.bat`.

```bash
npm run build    # export statico in ./out
npx serve out    # anteprima locale della build
```

## Deploy

Il workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) esegue il
build con `NEXT_PUBLIC_BASE_PATH=/<nome-repo>` e pubblica la cartella `out/` su GitHub
Pages ad ogni push su `main`.
