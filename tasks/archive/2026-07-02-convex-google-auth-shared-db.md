# Archived Task

Closed At: 2026-07-02T17:00:12.168Z
Result: FAIL
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-convex-google-auth-shared-db
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Dodac Convex jako zrodlo prawdy dla sesji pracy oraz logowanie Google, tak aby kazdy uzytkownik widzial tylko swoj rejestr na wielu urzadzeniach.

## Kryteria sukcesu
- Aplikacja ma flow logowania Google

## Priorytet / Blocker
Największy blocker teraz: Dodac Convex jako zrodlo prawdy dla sesji pracy oraz logowanie Google, tak aby kazdy uzytkownik widzial tylko swoj rejestr na wielu urzadzeniach.
Dowód blockera: prod Pages jest live, prod Convex jest wdrozony, ale Google OAuth zwraca redirect_uri_mismatch dla https://uncommon-cuttlefish-79.convex.site/api/auth/callback/google
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: dodac produkcyjny redirect URI Convex do Google Cloud Console dla tego klienta OAuth

## Kontekst dla agenta
Moduł: auth+convex integration
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- package.json
- package-lock.json
- .env.example
- index.html
- src/**
- convex/**
- tests/**
- .githooks/**
- .github/**
- AGENTS.md
- AGENT_DEV_POLICY.md
- CLAUDE.md
- CODEX.md
- ParkingLot.md
- RELEASE_GATE.md
- TESTING.md
- docs/**
- scripts/**
- workflow/**
- tasks/**
- tasks/todo.md
- tasks/archive/**
- tasks\todo.md
- .agents/**
- .claude/**
- skills-lock.json
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: auth+convex integration
Pliki: package.json, package-lock.json, .env.example, index.html, src/**, convex/**, tests/**, tasks/todo.md, tasks/archive/**

## Reprodukcja / dowód problemu
Task utworzony z polecenia użytkownika albo przez zamknięcie poprzedniego taska.

## Escalation
Czy brakuje danych do bezpiecznej zmiany?
NIE

Jeśli TAK:
Brakujące dane: brak
Czego nie da się potwierdzić: brak
Ryzyko kodowania teraz: niskie po utrzymaniu scope locka
Najmniejszy następny krok: wykonać najmniejszą zmianę z allowlisty

## Klasyfikacja
REQUIRED

Uzasadnienie:
Zmiana jest wymagana dla aktualnego stanu workflow.

## Diagnoza
Root cause: frontend i backend zostaly wdrozone, ale produkcyjny callback Google OAuth nie jest whitelistingowany w konfiguracji klienta Google.
Dowód: smoke test na https://poprostukoduj.pl po kliknieciu "Zaloguj przez Google" otwiera accounts.google.com z bledem redirect_uri_mismatch dla https://uncommon-cuttlefish-79.convex.site/api/auth/callback/google.
Aktualny flow: Pages prod -> Convex prod -> Google OAuth -> redirect_uri_mismatch -> brak mozliwosci dokonczenia logowania.

## Granice
Moduły dotknięte: auth+convex integration
Kontrakty dotknięte: do uzupełnienia, jeśli dotyczy.
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: spełnione kryteria sukcesu.
ERRORS: brak dowodu, zmiana poza scope albo failujące gate'y.
STATUSES: PASS / FAIL.
SIDE EFFECTS: tylko zmiany w plikach z allowlisty.
LOGS: komendy weryfikacyjne.
TESTS: do uzupełnienia przed końcem taska.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: nie zgadywać, użyć ESCALATION.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: sprawdzić idempotencję, jeśli task ma side effecty.
Concurrent request: nie dotyczy, chyba że task dotyka runtime.
Partial write: nie zostawiać pustego sukcesu.
Worker crash: nie dotyczy, chyba że task dotyka workera.
Retry loop: nie dodawać retry bez klasyfikacji błędów.
Provider unavailable: nie dotyczy, chyba że task dotyka providera.

## Guard Scope
REQUIRED GUARDS:
- trzymać się allowlisty.
- uruchomić testy wskazane w tasku.

NICE_TO_HAVE GUARDS:
- pomysły poza zakresem zapisać do ParkingLot.md.

OVERBUILD GUARDS:
- nie tworzyć nowego subsystemu bez osobnego taska.

ParkingLot.md updated:
NOT_NEEDED

## Runtime guards
State machine: do uzupełnienia, jeśli dotyczy.
Error classification: do uzupełnienia, jeśli dotyczy.
Idempotency: do uzupełnienia, jeśli dotyczy.
Single-flight: do uzupełnienia, jeśli dotyczy.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: do uzupełnienia, jeśli dotyczy.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
NIE

Jeśli TAK:
Plik: brak
LOC: brak
Dlaczego zmiana trafia tutaj: brak
Czy plik ma wiele odpowiedzialności: brak
Minimalny fix: brak
Czy potrzebne wydzielenie odpowiedzialności: brak
Ryzyko: brak

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: brak
LOC: brak
Obecne odpowiedzialności: brak
Czy task dokłada nową odpowiedzialność: brak
Minimalny fix bez rozbicia: brak
Małe wydzielenie odpowiedzialności: brak
Ryzyko minimalnego fixu: brak
Ryzyko wydzielenia: brak
Rekomendacja: brak

## Dependency Direction Guard
Czy zmiana odwraca zależność?
NIE

Czy Business Logic importuje UI/DB/framework?
NIE

Czy adapter przecieka do core?
NIE

## Change Isolation
Ile modułów dotyka zmiana: jeden wskazany obszar.
Czy to naturalne: tak.
Czy da się ograniczyć zmianę do jednego kontraktu: tak.

## Plan
- [ ] Przeczytać pliki z allowlisty.
- [ ] Wykonać najmniejszą bezpieczną zmianę.
- [ ] Uruchomić weryfikację.

## Weryfikacja
Komendy:
npm run typecheck
npm test
npx vite build --outDir %TEMP%\\time-tracker-prod-smoke
npx convex env set --prod --from-file <temp file>
npx convex deploy --env-file <temp deploy key env>
npx wrangler pages deploy <temp build dir> --project-name poprostukoduj --branch main
Smoke test: otwarcie https://poprostukoduj.pl i klikniecie "Zaloguj przez Google"
Expected result: frontend PASS, backend PASS, login FAIL na zewnetrznym OAuth redirect mismatch.

## Definition of Done
- [ ] test PASS
- [ ] build PASS albo NOT_NEEDED z uzasadnieniem
- [ ] brak ERROR w logach
- [ ] zmiana nie wychodzi poza zakres
- [ ] brak refaktoru przy okazji
- [ ] failure modes obsłużone
- [ ] brak silent fallbacków
- [ ] brak empty success
- [ ] UI truth zachowane, jeśli dotyczy
- [ ] dependency direction zachowany
- [ ] brak cyklicznych zależności
- [ ] duże pliki nie zostały powiększone bez uzasadnienia
- [ ] implementowano tylko REQUIRED GUARDS

## Review / Wyniki
Co zmieniono: wdrozono prod Convex na https://uncommon-cuttlefish-79.convex.cloud, ustawiono 5 envow prod dla auth i wdrozono frontend na Cloudflare Pages projektu poprostukoduj.
Jak sprawdzono: typecheck PASS, test PASS, build PASS, strona live laduje sie na https://poprostukoduj.pl, przycisk logowania jest widoczny, klik otwiera Google OAuth z bledem redirect_uri_mismatch.
PASS / FAIL: FAIL
Ryzyka: logowanie produkcyjne jest zablokowane przez stan zewnetrzny poza repo; sama aplikacja i backend sa live.
Follow-up: dodac do Google Cloud Console redirect URI https://uncommon-cuttlefish-79.convex.site/api/auth/callback/google, potem powtorzyc smoke test logowania.
