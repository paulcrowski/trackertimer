# Archived Task

Closed At: 2026-07-03T12:30:19.298Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-history-csv-truncation-contract
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Historia sesji i CSV maja jawnie komunikowac, gdy runtime pokazuje tylko ostatnie 100 sesji.

## Kryteria sukcesu
- UI i eksport nie wygladaja na pelne

## Priorytet / Blocker
Największy blocker teraz: Historia sesji i CSV maja jawnie komunikowac, gdy runtime pokazuje tylko ostatnie 100 sesji.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: history-ui-truth
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- convex/tracker.ts
- src/lib/trackerTypes.ts
- src/App.tsx
- src/components/SessionDialogs.tsx
- src/components/SessionsPanel.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: history-ui-truth
Pliki: tasks/todo.md, convex/tracker.ts, src/lib/trackerTypes.ts, src/App.tsx, src/components/SessionDialogs.tsx, src/components/SessionsPanel.tsx, tests/app.test.tsx

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
Root cause: backend `bootstrap` laduje wszystkie sesje do summary/dashboard, ale do `data.sessions` i `history` przekazuje tylko `slice(0, 100)`, przez co panel historii i eksport CSV wygladaja na pelne mimo ograniczonego zbioru.
Dowód: `convex/tracker.ts` zwraca `sessions: sortedSessions.slice(0, 100)` oraz `history: buildSessionHistory(sortedSessions.slice(0, 100))`, a `SessionsPanel` pokazuje tylko `Historia sesji` i `Eksport CSV` bez informacji o tym limicie.
Aktualny flow: konto ma >100 sesji -> summary liczy calosc -> historia i CSV pracuja tylko na ostatnich 100 -> UI nie sygnalizuje tej roznicy.

## Granice
Moduły dotknięte: `convex/tracker.ts`, `src/lib/trackerTypes.ts`, `src/App.tsx`, `src/components/SessionsPanel.tsx` i test renderu.
Kontrakty dotknięte: `TrackerHistory` ma powiedziec, czy widok jest ucięty; panel historii i przycisk eksportu maja to jasno komunikowac.
Poza zakresem: wszystko poza allowlistą; `src/components/SessionDialogs.tsx` jest tu tylko jako odziedziczony diff z poprzedniego zamknietego slice'a, bez nowej zmiany w tym tasku.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: jesli runtime pokazuje tylko ostatnie 100 sesji, UI i CSV sa oznaczone jako ograniczone do zaladowanego widoku.
ERRORS: UI nadal sugeruje pelna historie albo pelny eksport mimo uciecia.
STATUSES: PASS / FAIL.
SIDE EFFECTS: bez paginacji i bez nowego backendowego eksportu; naprawiamy prawde kontraktu, nie pojemnosc funkcji.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: local mode i pelny zestaw bez truncation nie powinny pokazywac komunikatu o limicie.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: nie dotyczy.
Concurrent request: nie dotyczy.
Partial write: nie dotyczy; zmiana dotyczy tylko ksztaltu danych i copy UI.
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
State machine: `bootstrap -> mark history truncated or full -> panel renderuje odpowiedni kontrakt`.
Error classification: truncation to jawny stan UI, nie ukryty szczegol implementacyjny.
Idempotency: nie dotyczy.
Single-flight: do uzupełnienia, jeśli dotyczy.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: historia i eksport nie moga obiecywac wiecej niz zaladowany runtime.
Observability: test renderu panelu oraz lokalne gate'y.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `convex/tracker.ts`, `src/App.tsx`, `src/components/SessionsPanel.tsx`, `tests/app.test.tsx`
LOC: ~1000 / ~500 / ~160 / ~600
Dlaczego zmiana trafia tutaj: backend zna limit 100, local bootstrap musi wystawic ten sam ksztalt danych, a falszywy kontrakt siedzi w panelu sesji.
Czy plik ma wiele odpowiedzialności: tak, glownie `convex/tracker.ts` i `src/App.tsx`.
Minimalny fix: dodac flagi/history metadata i skorygowac copy eksportu/widoku.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: niskie-srednie przez wielkosc plikow, ale kontrakt jest waski.

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
Co zmieniono: backend bootstrap wystawia teraz, czy historia jest ucięta i ile sesji jest łącznie; panel sesji pokazuje jawnie limit ostatnich 100 oraz oznacza eksport CSV jako ograniczony do załadowanego widoku; local mode zwraca pełny kontrakt bez truncation.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local` (w tym `lint`, `typecheck`, `test`, `build`).
PASS / FAIL: PASS
Ryzyka: funkcja nadal nie daje pełnego eksportu ani paginacji; kontrakt jest teraz prawdziwy, ale capability pozostaje ograniczone do ostatnich 100 sesji.
Follow-up: osobny task na paginację historii albo backendowy pełny eksport CSV, jeśli chcesz zamknąć problem capability, a nie tylko truthfulness.
