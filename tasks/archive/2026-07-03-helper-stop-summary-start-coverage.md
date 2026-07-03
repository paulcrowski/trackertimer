# Archived Task

Closed At: 2026-07-03T15:34:42.334Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-helper-stop-summary-start-coverage
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Helper preview przy STOP ma oznaczać niepełny coverage także wtedy, gdy pierwszy sygnał helpera pojawił się dopiero po starcie sesji.

## Kryteria sukcesu
- Helper preview nie udaje pełnego coverage

## Priorytet / Blocker
Największy blocker teraz: Helper preview przy STOP ma oznaczać niepełny coverage także wtedy, gdy pierwszy sygnał helpera pojawił się dopiero po starcie sesji.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: helper-stop-summary-start-coverage
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/lib/tracker.ts
- src/components/SessionDialogs.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: helper-stop-summary-start-coverage
Pliki: tasks/todo.md, src/lib/tracker.ts, src/components/SessionDialogs.tsx, tests/app.test.tsx

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
Root cause: helper preview oznaczał `isPartial` tylko wtedy, gdy brakowało końcówki sesji po ostatnim sygnale helpera. Gdy pierwszy sygnał helpera pojawiał się dopiero po starcie timera, UI dalej wyglądał jak pełny podgląd, mimo że początek sesji był niepokryty.
Dowód: `buildStopFocusSummary()` porównywał tylko `sessionEnd - lastConfirmedAt` z progiem świeżości. Nie było analogicznego guardu dla `firstConfirmedAt - sessionStart`, a copy w `StopDialog` mówiło wyłącznie o brakującej końcówce.
Aktualny flow: helper preview staje się `partial` zarówno przy brakującym początku, jak i brakującej końcówce sesji; dialog STOP komunikuje ogólnie brakujące fragmenty bez potwierdzonego sygnału helpera.

## Granice
Moduły dotknięte: helper-stop-summary-start-coverage
Kontrakty dotknięte: `buildStopFocusSummary` w `src/lib/tracker.ts`, copy `StopDialog`, testy helper preview.
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: aktywna sesja i helper sample, które mogą nie zaczynać się dokładnie od startu timera.
SUCCESS: helper preview oznacza `partial` także przy brakującym początku sesji; UI nie sugeruje, że brakujące minuty są pokryte albo zgadywane.
ERRORS: preview nie może wyglądać na pełny tylko dlatego, że końcówka jest świeża, jeśli początek sesji nie ma potwierdzonego sygnału helpera.
STATUSES: full coverage / partial coverage.
SIDE EFFECTS: brak zmian w persistence; tylko truthfulness helper preview w dialogu STOP.
LOGS: `npm test`, `npm run typecheck`, `npm run gate:local`.
TESTS: nowa regresja dla opóźnionego pierwszego sample helpera i pełny lokalny gate.
DONE: review ma konkretny wynik PASS i archive zachowuje dowód.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak sample dalej daje `null`; task nie zgaduje startowego coverage.
Invalid schema: nie dotyczy poza istniejącym shape helper activities.
Duplicate request: nie dotyczy, preview jest czysto pochodne.
Concurrent request: task nie zmienia współbieżności; tylko warunek `isPartial`.
Partial write: brak side-effectów; ważne jest, by UI nie dawał pustego sukcesu z nieoznaczonym brakiem początku sesji.
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
State machine: `session + helper samples -> detect first/last confirmed coverage -> mark partial/full -> render preview`.
Error classification: brak początku albo końca coverage to `partial_preview`, nie pełny success.
Idempotency: helper preview pozostaje czysto pochodne i deterministyczne.
Single-flight: nie dotyczy, brak fetch/job orchestration.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: helper preview nie może sugerować pełnego coverage, jeśli brakuje potwierdzonego początku sesji.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/lib/tracker.ts`, `src/components/SessionDialogs.tsx`, `tests/app.test.tsx`
LOC: ~1768, ~434, ~1237
Dlaczego zmiana trafia tutaj: helper preview seam i copy kontraktu STOP żyją już w tych plikach.
Czy plik ma wiele odpowiedzialności: tak.
Minimalny fix: doprecyzować warunek `isPartial` i uogólnić copy, bez nowego subsystemu coverage.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: dalszy mały wzrost dużych plików, ale zakres pozostaje jeden kontrakt.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `src/lib/tracker.ts`, `tests/app.test.tsx`
LOC: ~1768, ~1237
Obecne odpowiedzialności: helpery trackera, source-of-truth aktywnej sesji, controller, testy kontraktowe UI i runtime seams.
Czy task dokłada nową odpowiedzialność: nie, tylko doprecyzowuje istniejący helper preview contract.
Minimalny fix bez rozbicia: mały warunek startowego coverage i test regresyjny.
Małe wydzielenie odpowiedzialności: odłożone, bo to byłby osobny `STRUCTURE_FIX`.
Ryzyko minimalnego fixu: niskie.
Ryzyko wydzielenia: wyjście poza scope.
Rekomendacja: minimalny fix teraz.

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
Co zmieniono: `buildStopFocusSummary()` oznacza teraz `partial` także wtedy, gdy pierwszy sygnał helpera pojawia się istotnie po starcie sesji; copy `StopDialog` mówi ogólnie o brakujących fragmentach bez potwierdzonego sygnału; dodano regresję dla brakującego początku coverage.
Jak sprawdzono: `npm test` PASS, `npm run typecheck` PASS, `npm run gate:local` PASS.
PASS / FAIL: PASS
Ryzyka: preview nadal nie pokazuje jeszcze jawnej metryki coverage procentowego; to osobny follow-up capability, jeśli będzie potrzebny.
Follow-up: ewentualny osobny task na procent coverage helpera albo osobną metrykę „brakującego czasu”, nie na dalsze heurystyki w tym preview.
