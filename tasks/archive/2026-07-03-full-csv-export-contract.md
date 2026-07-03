# Archived Task

Closed At: 2026-07-03T13:50:56.651Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-full-csv-export-contract
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Eksport CSV ma zwracać pełną historię konta, a nie tylko bootstrapowe 100 sesji.

## Kryteria sukcesu
- Klik eksportu pobiera pełną listę sesji osobnym flow, a UI nie obiecuje już eksportu ograniczonego do 100 wpisów.

## Priorytet / Blocker
Największy blocker teraz: Eksport CSV ma zwracać pełną historię konta, a nie tylko bootstrapowe 100 sesji.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: full-csv-export
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- convex/tracker.ts
- src/App.tsx
- src/components/TrackerWorkspace.tsx
- src/lib/tracker.ts
- src/lib/trackerTypes.ts
- src/components/SessionsPanel.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: full-csv-export
Pliki: tasks/todo.md, convex/tracker.ts, src/App.tsx, src/components/TrackerWorkspace.tsx, src/lib/tracker.ts, src/lib/trackerTypes.ts, src/components/SessionsPanel.tsx, tests/app.test.tsx

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
Root cause: `bootstrap` ucina `sessions` do `100`, a `exportSessions()` w controllerze budował CSV bezpośrednio z `data.sessions`. Przez to pełny eksport dziedziczył techniczne ograniczenie payloadu startowego.
Dowód: `bootstrap` robi `sortedSessions.slice(0, 100)` w `convex/tracker.ts`, a frontendowy `exportSessions()` przed tym taskiem wywoływał `buildSessionsCsv(data.sessions)` bez osobnego fetchu.
Aktualny flow: konto ma >100 sesji -> widok historii pokazuje ostatnie `100` -> klik eksportu pobiera tylko te same `100`, mimo że produkt obiecuje eksport CSV historii.

## Granice
Moduły dotknięte: `convex/tracker.ts`, `src/App.tsx`, `src/lib/tracker.ts`, `src/lib/trackerTypes.ts`, `src/components/TrackerWorkspace.tsx`, `src/components/SessionsPanel.tsx` i test kontraktu.
Kontrakty dotknięte: eksport CSV ma brać pełną historię konta osobnym flow; truncation `100` zostaje tylko kontraktem widoku historii.
Poza zakresem: paginacja historii, przebudowa dashboardu, zmiana limitu bootstrapu.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: cloud export odpytuje osobny backendowy query z pełną listą sesji, local export zwraca pełny lokalny stan, a UI przy przyciętym widoku mówi wyraźnie, że pełny eksport bierze całą historię konta.
ERRORS: eksport dalej korzysta z `data.sessions` albo copy nadal wiąże eksport z ostatnimi `100` rekordami.
STATUSES: PASS / FAIL.
SIDE EFFECTS: dodatkowy query tylko na żądanie eksportu.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`, `npm run gate:local`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: nie zgadywać, użyć ESCALATION.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: wielokrotny eksport ma tylko ponownie pobrać i pobrać CSV, bez mutacji backendu.
Concurrent request: bootstrap może dalej pokazywać `100`, ale eksport musi niezależnie pobrać pełną listę.
Partial write: użytkownik nie może dostać „pełnego eksportu”, który jest tylko odbiciem bootstrapowego limitu.
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
State machine: `bootstrap history -> last 100`; `export click -> dedicated full-session fetch`; `export success -> download CSV`; `export failure -> existing error surface`.
Error classification: błąd eksportu idzie istniejącym error surface App/Controller, bez silent fallbacku do `data.sessions`.
Idempotency: eksport jest read-only i może zostać wywołany wielokrotnie.
Single-flight: eksport używa istniejącego `busyAction`, ale bez nowego subsystemu kolejkowania.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: `100` dotyczy tylko widoku; przycisk i copy mówią o pełnym eksporcie.
Observability: test copy, `typecheck`, `gate:local`.

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
- [x] Przeczytać pliki z allowlisty.
- [x] Wykonać najmniejszą bezpieczną zmianę.
- [x] Uruchomić weryfikację.

## Weryfikacja
Komendy:
- `npm test`
- `npm run typecheck`
- `npm run gate:local`
Expected result: PASS.

## Definition of Done
- [x] test PASS
- [x] build PASS albo NOT_NEEDED z uzasadnieniem
- [x] brak ERROR w logach
- [x] zmiana nie wychodzi poza zakres
- [x] brak refaktoru przy okazji
- [x] failure modes obsłużone
- [x] brak silent fallbacków
- [x] brak empty success
- [x] UI truth zachowane, jeśli dotyczy
- [x] dependency direction zachowany
- [x] brak cyklicznych zależności
- [x] duże pliki nie zostały powiększone bez uzasadnienia
- [x] implementowano tylko REQUIRED GUARDS

## Review / Wyniki
Co zmieniono: dodałem osobny query `sessionsForExport` z pełną historią użytkownika, nowy handler `onExportSessions` dla cloud/local oraz controllerowy eksport, który buduje CSV z wyniku dedykowanego fetchu zamiast z `data.sessions`. Dodatkowo `SessionsPanel` rozdziela teraz uczciwie kontrakt widoku `100` od pełnego eksportu CSV.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local`
PASS / FAIL: PASS
Ryzyka: widok historii nadal jest ograniczony do `100` w bootstrapie; ten task rozwiązuje kontrakt eksportu, nie capability przeglądania całej historii w UI.
Follow-up: osobny task na paginację albo pełny archive browser, jeśli chcesz rozszerzyć także widok historii poza ostatnie `100`.
