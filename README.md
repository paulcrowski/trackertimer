# worktimer

`worktimer` to tracker czasu pracy oparty o React + Convex, gotowy do
wdrozenia jako frontend na Cloudflare Pages i backend na Convex.

## Co robi aplikacja

- logowanie przez Google z tym samym kontem na wielu urzadzeniach
- mierzenie aktywnej sesji pracy
- reczne dodawanie, edycja i usuwanie sesji
- eksport historii do CSV
- lokalny modul pomodoro
- instalowalna PWA z manifestem i service workerem

## Stack

- frontend: React 19 + Vite
- backend: Convex
- auth: Convex Auth + Google OAuth
- hosting: Cloudflare Pages

## Uruchomienie lokalne

Wymagania:
- Node.js 22+
- skonfigurowany projekt Convex

Instalacja:

```bash
npm install
```

Dev:

```bash
npx convex dev
npm run dev
```

## Najwazniejsze skrypty

```bash
npm run dev
npm run test
npm run typecheck
npm run build
npm run gate:local
```

## Deploy

Frontend wymaga buildu z prawdziwym `VITE_CONVEX_URL`. Samo `wrangler pages deploy dist`
na starym albo lokalnym `dist` nie wystarcza.

### Convex prod

Przyklad deployu na docelowy deployment Convex:

```bash
tmp=$(mktemp)
printf 'CONVEX_DEPLOYMENT=your-convex-deployment\n' > "$tmp"
npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL --env-file "$tmp"
rm -f "$tmp"
```

### Cloudflare Pages

Przed deployem Pages zbuduj frontend z poprawnym URL backendu:

```bash
VITE_CONVEX_URL=https://your-project.convex.cloud npm run build
npx wrangler pages deploy dist --project-name worktimer --branch main --commit-dirty true
```

## PWA i powiadomienia

- manifest: [public/manifest.webmanifest](/Users/ppwro/_work/trackertimer/public/manifest.webmanifest:1)
- service worker: [public/sw.js](/Users/ppwro/_work/trackertimer/public/sw.js:1)
- logika PWA: [src/lib/pwa.ts](/Users/ppwro/_work/trackertimer/src/lib/pwa.ts:1)
- logika pomodoro: [src/lib/pomodoro.ts](/Users/ppwro/_work/trackertimer/src/lib/pomodoro.ts:1)

Po wejściu na produkcję:
- zaloguj się przez Google
- kliknij `Wlacz powiadomienia`
- uruchom preset `5 / 1`, zeby szybko sprawdzic koniec cyklu

## Git i workflow

Repo pracuje z task lifecycle z `AGENTS.md`.

Przed zamknieciem zmiany oczekiwane sa:
- task w `tasks/todo.md`
- archiwizacja taska do `tasks/archive`
- PASS dla testow i buildu
- jawny deploy proof dla zmian produkcyjnych
