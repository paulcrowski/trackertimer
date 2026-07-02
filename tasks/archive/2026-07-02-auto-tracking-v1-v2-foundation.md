# Archived Task

Closed At: 2026-07-02T21:03:48.766Z
Result: FAIL
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-auto-tracking-v1-v2-foundation
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Wdrozyc fundament V1/V2: projekty pracy, opt-in auto-trackingu, pause, reguly prywatnosci i sugestie sesji gotowe na desktop helper.

## Kryteria sukcesu
- Uzytkownik moze przypisywac sesje do projektu

## Priorytet / Blocker
Największy blocker teraz: Wdrozyc fundament V1/V2: projekty pracy, opt-in auto-trackingu, pause, reguly prywatnosci i sugestie sesji gotowe na desktop helper.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: tracker
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- convex/schema.ts
- convex/tracker.ts
- convex/trackerModel.ts
- convex/http.ts
- convex/_generated/**
- src/lib/trackerTypes.ts
- src/lib/tracker.ts
- src/components/TrackerWorkspace.tsx
- src/components/TrackerPanels.tsx
- src/components/SessionDialogs.tsx
- src/App.tsx
- src/index.css
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: tracker
Pliki: tasks/todo.md, convex/schema.ts, convex/tracker.ts, convex/trackerModel.ts, convex/http.ts, convex/_generated/**, src/lib/trackerTypes.ts, src/lib/tracker.ts, src/components/TrackerWorkspace.tsx, src/components/TrackerPanels.tsx, src/components/SessionDialogs.tsx, src/App.tsx, src/index.css, tests/app.test.tsx

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
Root cause: tracker byl manual-only i nie mial kontraktu projektu, zgody auto-trackingu, pause, reguł prywatności ani source-of-truth dla sugestii z helpera desktopowego.
Dowód: schema i bootstrap zwracały tylko sesje, activeSession i proste preferences bez projektów/rules/suggestions.
Aktualny flow: standard timer działał, ale nie było gdzie bezpiecznie przypisać aktywności z Codexa/ChatGPT/Canvy/OBS do projektu.

## Granice
Moduły dotknięte: Convex schema + tracker runtime + workspace UI.
Kontrakty dotknięte: sessions/activeSessions/preferences, helper HTTP ingest, projekt/rule/suggestion bootstrap.
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
State machine: tracking preference -> disabled / enabled / paused_until / paused_manual; suggestion -> pending / accepted / dismissed.
Error classification: invalid helper key i ownership checks fail-closed przez ConvexError.
Idempotency: `trackingSuggestions.by_user_and_event_id` blokuje duplikaty eventów z helpera.
Single-flight: do uzupełnienia, jeśli dotyczy.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: auto-tracking jest jawnie opt-in i pokazuje pause/status/helper key zamiast udawać domyślny tracking.
Observability: `npm run typecheck`, `npm test`, `npm run build`, `npm run gate:local`.

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
- `CONVEX_DEPLOYMENT=bold-lyrebird-441 npx convex codegen`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run gate:local`
Expected result: typecheck/test/build PASS; gate:local FAIL na diff-size guard.

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
Co zmieniono: dodano projekty pracy, rozszerzone sesje z `project/source`, ustawienia auto-trackingu, pause/helper key, reguły prywatności, sugestie auto-trackingu oraz endpoint `/api/desktop/activity`.
Jak sprawdzono: `codegen`, `typecheck`, `test`, `build` przeszły; `gate:local` zatrzymał task na `check:diff-size` (1768 counted lines vs limit 250 dla FEATURE).
PASS / FAIL: FAIL
Ryzyka: funkcjonalnie działa lokalnie, ale repo workflow wymaga rozbicia tego na mniejsze slicy przed uznaniem taska za gotowy.
Follow-up: rozbić na osobne taski: 1) projekty + sesje, 2) settings/pause/helper key, 3) rules + suggestions + helper ingest.
