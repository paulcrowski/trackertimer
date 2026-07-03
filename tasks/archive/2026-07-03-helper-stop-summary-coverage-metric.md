# Archived Task

Closed At: 2026-07-03T16:10:53.386Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-helper-stop-summary-coverage-metric
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Helper preview przy STOP ma pokazywać jawnie, ile aktywnej sesji helper faktycznie pokrywa i ile czasu pozostaje bez potwierdzonego sygnału.

## Kryteria sukcesu
- Przy partial preview user widzi jawny covered vs missing time zamiast samej heurystyki partial/full.

## Priorytet / Blocker
Największy blocker teraz: Helper preview przy STOP ma pokazywać jawnie, ile aktywnej sesji helper faktycznie pokrywa i ile czasu pozostaje bez potwierdzonego sygnału.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: helper-stop-summary-coverage-metric
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
Moduł: helper-stop-summary-coverage-metric
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
Root cause: helper preview miał już stan `partial`, ale nie mówił userowi ile aktywnej sesji helper realnie pokrywa. Użytkownik widział tylko heurystykę „preview jest niepełny”, bez konkretu jaki kawałek sesji jest potwierdzony, a jaki nie.
Dowód: `StopDialog` pokazywał tylko sumy `trackedSeconds/work/private/distraction` i ogólny komunikat o niepełnym preview. `StopFocusSummary` nie wystawiał jawnego `missingSeconds`, mimo że dało się policzyć brakujący czas jako różnicę między realnym aktywnym czasem sesji a potwierdzonym helper coverage.
Aktualny flow: helper preview przy partial state pokazuje teraz jawnie covered vs missing time dla aktywnej sesji, liczone po odjęciu pauz timera.

## Granice
Moduły dotknięte: helper-stop-summary-coverage-metric
Kontrakty dotknięte: `StopFocusSummary` w `src/lib/tracker.ts`, copy `StopDialog`, testy helper preview.
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: aktywna sesja z realnym tracked time oraz helper preview mogący być partial.
SUCCESS: przy partial preview user widzi jawny confirmed vs missing time, a brakujące minuty nie są ukryte za samym `isPartial`.
ERRORS: preview nie może komunikować jedynie „partial”, jeśli da się policzyć ile czasu helper nie pokrył.
STATUSES: full coverage / partial coverage z `missingSeconds`.
SIDE EFFECTS: brak zmian w persistence; tylko truthfulness preview w STOP dialogu.
LOGS: `npm test`, `npm run typecheck`, `npm run gate:local`.
TESTS: render test dialogu i regresje `missingSeconds` w helper summary.
DONE: review ma konkretny wynik PASS i archive zachowuje dowód.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak preview dalej daje `null`; task nie zgaduje coverage bez danych.
Invalid schema: nie dotyczy poza istniejącym shape summary.
Duplicate request: nie dotyczy, preview jest czysto pochodne.
Concurrent request: task nie zmienia współbieżności; tylko wystawia jawny brakujący czas.
Partial write: brak side-effectów; ważne jest, żeby preview nie maskował brakujących minut.
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
State machine: `active session tracked time + helper covered time -> missingSeconds -> render partial coverage`.
Error classification: `partial_preview` ma teraz jawny metryczny brakujący czas, nie tylko bool.
Idempotency: preview pozostaje czysto pochodne i deterministyczne.
Single-flight: nie dotyczy, brak fetch/job orchestration.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: STOP dialog nie może ukrywać, ile aktywnej sesji helper realnie nie pokrył.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/lib/tracker.ts`, `src/components/SessionDialogs.tsx`, `tests/app.test.tsx`
LOC: ~1773, ~436, ~1242
Dlaczego zmiana trafia tutaj: helper preview model i copy kontraktu STOP żyją w tych plikach.
Czy plik ma wiele odpowiedzialności: tak.
Minimalny fix: dodać `missingSeconds` i pokazać je tylko w partial preview.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: dalszy mały wzrost dużych plików, ale zakres pozostaje pojedynczym kontraktem.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `src/lib/tracker.ts`, `tests/app.test.tsx`
LOC: ~1773, ~1242
Obecne odpowiedzialności: helpery trackera, source-of-truth aktywnej sesji, controller, testy kontraktowe UI i runtime seams.
Czy task dokłada nową odpowiedzialność: nie, tylko doprecyzowuje istniejący preview contract.
Minimalny fix bez rozbicia: jedno pole `missingSeconds` i mały render copy.
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
Co zmieniono: helper preview ma teraz `missingSeconds`; partial STOP dialog pokazuje jawnie ile aktywnej sesji helper pokrywa i ile czasu pozostaje bez potwierdzonego sygnału; testy sprawdzają te liczby dla scenariuszy stale/missing-start/pauzy.
Jak sprawdzono: `npm test` PASS, `npm run typecheck` PASS, `npm run gate:local` PASS.
PASS / FAIL: PASS
Ryzyka: to nadal nie jest pełny audyt datasetu helpera, tylko uczciwszy kontrakt preview; jeśli kiedyś potrzebna będzie bardzo dokładna analityka coverage, trzeba będzie modelować to szerzej.
Follow-up: ewentualny osobny task na procent coverage helpera albo osobną sekcję „niepokryty czas”, jeśli użytkownicy będą tego realnie potrzebować.
