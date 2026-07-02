# Archived Task

Closed At: 2026-07-02T21:25:45.993Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-project-attribution-v1
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Dodac przypisywanie sesji do projektu i podsumowanie czasu per projekt, zeby mozna bylo policzyc prace nad Po prostu Koduj bez auto-trackingu desktopowego.

## Kryteria sukcesu
- Uzytkownik moze ustawic projekt dla sesji timer/manual/edit i zobaczyc czas per projekt w dashboardzie

## Priorytet / Blocker
Największy blocker teraz: Dodac przypisywanie sesji do projektu i podsumowanie czasu per projekt, zeby mozna bylo policzyc prace nad Po prostu Koduj bez auto-trackingu desktopowego.
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
- src/lib/trackerTypes.ts
- src/lib/tracker.ts
- src/components/SessionDialogs.tsx
- src/components/TrackerPanels.tsx
- src/components/TrackerWorkspace.tsx
- src/App.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: tracker
Pliki: tasks/todo.md, convex/schema.ts, convex/tracker.ts, convex/trackerModel.ts, src/lib/trackerTypes.ts, src/lib/tracker.ts, src/components/SessionDialogs.tsx, src/components/TrackerPanels.tsx, src/components/TrackerWorkspace.tsx, src/App.tsx, tests/app.test.tsx

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
Root cause: sesje nie miały spójnego atrybutu projektu dostępnego end-to-end w timerze, zapisie ręcznym, edycji i dashboardzie, więc nie dało się policzyć czasu dla jednego przedsięwzięcia bez desktop trackingu.
Dowód: brak `projectName` w pełnym flow UI/backend oraz brak agregacji czasu per projekt w dashboardzie.
Aktualny flow: start/manual/edit zapisuje `projectName`, backend utrwala pole w `sessions`, a dashboard liczy top projekt z historii sesji.

## Granice
Moduły dotknięte: tracker
Kontrakty dotknięte: kontrakt `SessionRecord` / `ActiveSession` / `SessionDraft`, mutacje Convex `start`, `addManualSession`, `updateSession`, oraz dashboard UI dla podsumowania czasu per projekt.
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
State machine: `idle -> activeSession -> saved session`; projekt jest tylko atrybutem sesji i nie tworzy nowego stanu runtime.
Error classification: walidacja i ownership zostają po stronie istniejących mutacji Convex; brak nowych fallbacków.
Idempotency: bez zmian względem istniejących mutacji; task nie dodaje nowych retry ani side-effect loopów.
Single-flight: do uzupełnienia, jeśli dotyczy.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: źródłem prawdy dla zapisanych projektów są rekordy `sessions`; dashboard liczy podsumowanie z aktualnych danych bootstrap.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `convex/trackerModel.ts`, `src/components/SessionDialogs.tsx`, `src/components/TrackerPanels.tsx`
LOC: około 301 / 316 / 441
Dlaczego zmiana trafia tutaj: to istniejące miejsca kontraktu sesji i dashboardu.
Czy plik ma wiele odpowiedzialności: umiarkowanie, ale task nie dokłada nowego subsystemu.
Minimalny fix: dopisanie pola projektu i podsumowania bez refaktoru.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: dalsze rozbudowy dashboardu/controllera powinny iść osobnym taskiem.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `src/lib/tracker.ts`
LOC: około 776
Obecne odpowiedzialności: helpery formatujące, snapshot aktywnej sesji, CSV, kontroler workspace.
Czy task dokłada nową odpowiedzialność: nie, tylko rozszerza istniejący kontrakt sesji o `projectName`.
Minimalny fix bez rozbicia: tak
Małe wydzielenie odpowiedzialności: możliwe później dla controllera/dashboard helpers
Ryzyko minimalnego fixu: rosnący koszt kolejnych zmian w tym pliku
Ryzyko wydzielenia: zbyt duży diff poza zakresem taska
Rekomendacja: zostawić jako minimal fix, a split zrobić osobno jeśli dojdzie więcej logiki projektów/trackingu.

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
- `npm run typecheck`
- `npm test`
- `npm run build`
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
Co zmieniono: dodano `projectName` do flow sesji timer/manual/edit, eksportu CSV i podsumowania dashboardu; backend Convex zapisuje pole zarówno dla aktywnej, jak i zakończonej sesji.
Jak sprawdzono: `npm run typecheck`, `npm test`, `npm run build`, `npm run gate:local`.
PASS / FAIL: PASS
Ryzyka: `src/lib/tracker.ts` pozostaje dużym plikiem; kolejny krok dla auto-trackingu desktopowego powinien mieć osobny task i osobny kontrakt.
Follow-up: desktop auto-tracking, źródła aktywności spoza przeglądarki i ewentualny ingestion helper są poza tym taskiem.
