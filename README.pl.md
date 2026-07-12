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

Desktop helper jest opcjonalną warstwą automatyzacji dla macOS i Windows.
Co kilka sekund odczytuje aplikację działającą na pierwszym planie, tytuł jej
okna oraz — jeśli jest dostępna — domenę aktywnej karty przeglądarki. Próbki są
wysyłane do chronionego endpointu Convex i przypisywane do zalogowanego konta.

W praktyce oznacza to:

- nadal ręcznie decydujesz, kiedy zaczyna się i kończy właściwa sesja
- możesz uruchomić sesję na podstawie świeżego kontekstu helpera
- reguły domen i aplikacji mogą podpowiadać projekt
- brak sygnału helpera może uruchomić opcjonalną auto-pauzę
- przy STOP dostajesz przegląd kontekstów, czasu pracy, rozproszeń, prywatnych
  bloków i okresów bez pokrycia
- raport można poprawić przed zapisaniem; helper jest wskazówką, a nie
  niepodważalnym źródłem prawdy

### Raport aktywności przy STOP

Helper łączy kolejne próbki w czytelne bloki. Powtarzające się aplikacje lub
domeny są grupowane, a krótkie aktywności pokazują sekundy zamiast mylącego
`0h 0m`. Prywatne domeny można zamaskować — backend zapisuje wtedy wyłącznie
informację `Prywatna domena`, bez nazwy strony i tytułu okna.

`Brak pokrycia helpera` oznacza fragment sesji, dla którego nie było świeżego,
wiarygodnego sygnału. Najczęstsze powody to wyłączony helper, stary klucz,
uśpiony komputer albo helper uruchomiony dopiero po rozpoczęciu timera.

Helper widzi aktywne okno. Jeżeli OBS, ScreenFlow lub inne narzędzie nagrywa w
tle, raport pokazuje aplikację, w której naprawdę pracujesz, np. Canva lub
Chrome. Dzięki temu ten sam czas nie jest liczony podwójnie jako „nagrywanie” i
„praca w aplikacji”.

### Mac i Windows jednocześnie

Sesja timera jest wspólna dla konta cloud. Możesz otworzyć worktimer na Macu i
Windowsie — oba ekrany sterują tym samym timerem, a powtórny START lub STOP jest
bezpieczny i nie tworzy drugiej sesji.

Każdy komputer powinien mieć własny starter i klucz helpera:

1. Na pierwszym komputerze rozwiń `Automatyczne wykrywanie aktywności`.
2. Wygeneruj klucz i pobierz starter dla tego systemu.
3. Powtórz te kroki na drugim komputerze.

Wygenerowanie startera dla kolejnego urządzenia nie unieważnia już helperów,
które działają na pozostałych komputerach.

### Prywatność i sterowanie

- helper można wyłączyć lub wstrzymać na 15 minut, 60 minut albo bezterminowo
- lista prywatnych domen jest konfigurowana przez użytkownika
- aktywność prywatna jest maskowana przed zapisaniem próbki
- helper nie uruchamia i nie zapisuje sesji w tle bez decyzji użytkownika
- zwykły timer działa bez helpera

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

Produkcja tego repo ma osobne polecenie, które wymusza właściwy deployment
Convex i chroni przed przypadkowym zbudowaniem frontendu z lokalnym adresem:

```bash
npm run build:production
npm run deploy:production
```

Przykład dla własnego deploymentu:

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
