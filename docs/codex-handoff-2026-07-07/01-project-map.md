# Mapa projektu

## Główna idea

Projekt ma dostarczać uczciwy tracker czasu pracy:

- manualny start/pauza/stop jako źródło prawdy,
- lokalna historia i eksport CSV,
- cloud sync po Google loginie,
- prywatny tryb lokalny bez backendu,
- opcjonalny helper desktopowy do wzbogacania kontekstu.

Nie zmieniaj tego kierunku na pełny, cichy auto-tracking. Jeśli AI/helper ma pomagać, powinien proponować, podsumowywać i klasyfikować, ale użytkownik zachowuje kontrolę nad sesją.

## Stack

- Node.js: wymagane `>=22`.
- Frontend: React 19, TypeScript, Vite 6, Tailwind CSS 4 przez Vite plugin.
- Backend: Convex.
- Auth: `@convex-dev/auth` + Auth.js provider Google.
- Ikony: `lucide-react`.
- Testy: Node test runner przez `tsx --test`.

## Najważniejsze komendy

```bash
npm install
npx convex dev
npm run dev
npm run typecheck
npm test
npm run build
npm run ci
```

Frontend dev domyślnie działa na:

```text
http://localhost:3000
```

## Kluczowe pliki

- `package.json` - skrypty i zależności.
- `src/App.tsx` - wybór trybu cloud/local, lokalny flow i bootstrap UI.
- `src/lib/startupMode.ts` - decyzja, czy startować cloud, local czy chooser.
- `src/lib/localTrackerStore.ts` - Private local przez IndexedDB, migracja z legacy localStorage, fail-closed storage.
- `src/lib/tracker.ts` - shared frontend logic: typy, lokalne helpery, auto-pauza, stop summary, controller.
- `src/lib/trackerTypes.ts` - typy kontraktu workspace.
- `src/components/TrackerWorkspace.tsx` - główny workspace.
- `src/components/TrackerPanels.tsx` - panele timera, ustawień i helpera.
- `src/components/SessionDialogs.tsx` - formularze stop/manual/edit i preview helper summary.
- `src/components/SessionsPanel.tsx` - historia i eksport.
- `convex/schema.ts` - tabele Convex.
- `convex/auth.ts` / `convex/auth.config.ts` - Google auth przez Convex Auth.
- `convex/http.ts` - endpoint helpera `/api/desktop/activity`.
- `convex/tracker.ts` - query/mutation source of truth dla cloud.
- `convex/trackerModel.ts` - shared model: summary, dashboard, cross-midnight split, paused durations.
- `worktimer-helper.mjs` - launcher helpera.
- `scripts/desktop-helper.mjs` - implementacja helpera macOS/Windows.
- `tests/app.test.tsx` - główny kontrakt regresji.

## Dane i schemat

Tabele Convex:

- `sessions` - zapisane sesje historyczne.
- `activeSessions` - jedna aktywna sesja per user.
- `trackerPreferences` - ustawienia timera/helpera.
- `desktopHelpers` - helper key i ostatni status.
- `desktopHelperActivities` - skompaktowany log aktywności helpera.
- `trackingRules` - mapowanie app/domena -> projekt.
- plus tabele auth z `authTables`.

W Private local zapis jest w IndexedDB:

```text
db: worktimer-local
store: trackerState
record key: state
```

Legacy localStorage key:

```text
worktimer.local-state.v1
```

## Kontrakty produktu

- Cloud sync wymaga logowania Google i Convex.
- Private local nie synchronizuje danych między urządzeniami.
- Private local ma nie pokazywać pustego workspace, jeśli storage jest niedostępny albo uszkodzony.
- Historia w bootstrapie cloud pokazuje limitowane sesje, ale eksport ma pobierać pełną historię.
- Manualne sesje i stop aktywnej sesji mogą być dzielone przez północ na osobne rekordy dzienne.
- Pauzy odejmują się od czasu sesji, także przy przejściu przez północ.
- Auto-pauza w prostym trybie oznacza bezczynność w oknie appki.
- Auto-pauza w zaawansowanym trybie oznacza ciszę helpera, nie aktywność okna appki.
- Helper status jest świeży przez `20_000 ms`.
- STOP summary z helpera jest tylko advisory preview; zapis historii nadal opiera się na manualnym stopie.

## Desktop helper

Endpoint:

```text
POST <CONVEX_SITE_URL>/api/desktop/activity
Authorization: Bearer <helper-key>
```

Frontend buduje site URL z Convex cloud URL:

```text
https://<deployment>.convex.cloud -> https://<deployment>.convex.site/api/desktop/activity
```

Launcher:

```bash
node worktimer-helper.mjs --url "<ingest-url>" --key "<helper-key>"
```

Helper obsługuje macOS i Windows. Linux nie jest obecnie wspierany.

Prywatność helpera:

- prywatne domeny z preferencji są maskowane jako `Prywatna domena`,
- znane prywatne appki są klasyfikowane jako private,
- rozpraszacze typu YouTube/Facebook/Reddit/X są klasyfikowane jako distraction,
- helper loguje zmiany kontekstu i okresowe próbki, nie każdą sekundę.
