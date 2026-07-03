# worktimer

[English version](./README.en.md)

`worktimer` to prosty tracker czasu pracy z dwoma trybami:

- `Google / cloud` jeśli chcesz mieć jedno konto i historię między urządzeniami.
- `Private local` jeśli chcesz trzymać dane tylko lokalnie w tej przeglądarce.

To nie jest system do automatycznego śledzenia wszystkiego za plecami użytkownika.
Podstawą produktu jest ręczny start i ręczny stop sesji. Automatyzacja helpera
desktopowego jest opcjonalna.

## Co tu jest fajne

- dwa uczciwe tryby pracy: zsynchronizowany `Google / cloud` i lokalny `Private local`
- manual-first zamiast udawanej "pełnej automatyzacji AI"
- opcjonalny helper desktopowy, który może podpowiadać kontekst i wspierać auto-pauzę
- CSV, Pomodoro i PWA w jednej małej aplikacji

## Live demo

- [worktimer-5gn.pages.dev](https://worktimer-5gn.pages.dev)

## Co potrafi

- start, pauza i stop aktywnej sesji
- ręczne dodawanie, edycja i usuwanie wpisów
- eksport historii do CSV
- prosty dashboard z podsumowaniem i trendem
- lokalny Pomodoro z powiadomieniami
- opcjonalny desktop helper dla trybu zaawansowanego
- instalowalna PWA

## Jak działa wybór trybu

### Google / cloud

Ten tryb używa Convex i logowania przez Google. To dobry wybór, jeśli:

- chcesz mieć te same dane na kilku urządzeniach
- chcesz zachować historię po zmianie komputera
- chcesz korzystać z helpera desktopowego w pełnym flow

### Private local

Ten tryb zapisuje dane lokalnie w przeglądarce na tym urządzeniu. To dobry
wybór, jeśli:

- chcesz zacząć bez logowania
- nie chcesz synchronizacji do backendu
- traktujesz ten tracker jako prywatny licznik czasu na jednym urządzeniu

Jeśli przeglądarka nie daje bezpiecznego trwałego storage, aplikacja nie udaje
sukcesu i nie pokaże pustego workspace.

## Szybki start lokalnie

Wymagania:

- Node.js 22+
- projekt Convex uruchomiony lokalnie albo własny deployment Convex

Instalacja:

```bash
npm install
```

Development:

```bash
npx convex dev
npm run dev
```

Domyślnie frontend wystartuje na `http://localhost:3000`.

## Zmienne środowiskowe

Skopiuj `.env.example` i ustaw:

```bash
VITE_CONVEX_URL="https://your-project.convex.cloud"
```

W local dev `npx convex dev` zwykle uzupełnia ten adres automatycznie.

## Desktop helper

Desktop helper jest dodatkiem dla trybu zaawansowanego. Zbiera kontekst aktywnej
aplikacji albo domeny w przeglądarce i wysyła go do endpointu ingestu.

W praktyce oznacza to:

- nadal ręcznie startujesz i kończysz sesję
- helper może podpowiedzieć projekt albo wesprzeć auto-pauzę
- helper działa obecnie na macOS i Windows

Repo zawiera gotowy launcher:

```bash
node worktimer-helper.mjs --url "<ingest-url>" --key "<helper-key>"
```

## Testy i build

Najważniejsze komendy:

```bash
npm run typecheck
npm test
npm run build
npm run ci
```

`npm run ci` odpala ten sam prosty zestaw, którego używa publiczny workflow
GitHub Actions: typecheck, test i build.

## Deploy

Do poprawnego buildu frontend potrzebuje prawdziwego `VITE_CONVEX_URL`.

Przykład:

```bash
VITE_CONVEX_URL="https://your-project.convex.cloud" npm run build
```

Potem możesz wdrożyć frontend tam, gdzie chcesz. Repo było budowane pod Vite +
Convex, więc hosting statyczny dla `dist/` plus backend Convex to naturalna
ścieżka.

## O czym warto wiedzieć

- `Private local` nie synchronizuje danych między urządzeniami.
- Desktop helper jest opcjonalny, nie wymagany do zwykłego trackowania czasu.
- Jeśli chcesz udostępnić projekt publicznie, najpierw ustaw własny deployment
  Convex i własne dane OAuth.
