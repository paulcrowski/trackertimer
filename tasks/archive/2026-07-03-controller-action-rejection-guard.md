# Archived Task

Closed At: 2026-07-03T13:12:42.625Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-controller-action-rejection-guard
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
UI akcje trackera nie mogą kończyć się unhandled promise rejection po tym, jak błąd został już sklasyfikowany i pokazany użytkownikowi.

## Kryteria sukcesu
- Controller domyka async action flow bez unhandled rejection

## Priorytet / Blocker
Największy blocker teraz: UI akcje trackera nie mogą kończyć się unhandled promise rejection po tym, jak błąd został już sklasyfikowany i pokazany użytkownikowi.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: controller-error-flow
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/lib/tracker.ts
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: controller-error-flow
Pliki: tasks/todo.md, src/lib/tracker.ts, tests/app.test.tsx

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
Root cause: controller handlery `handleStartSession`, `handleManualAdd`, `handleEditSave`, `handleStopConfirm` i podobne są wywoływane z UI przez `void controller...()`, ale po stronie action wrappers błędy są dalej rzucane. To może kończyć się unhandled promise rejection mimo że błąd jest już sklasyfikowany i pokazany w UI.
Dowód: `TrackerWorkspace` odpala wiele async akcji przez `void`, `CloudApp` i local wrappers nadal robią `throw new Error(message)`, a controller w `src/lib/tracker.ts` nie ma warstwy, która odróżnia “błąd już obsłużony w UI” od prawdziwego successu.
Aktualny flow: akcja UI -> wrapper ustawia `setError(message)` -> promise nadal się odrzuca -> event handler go nie awaituje ani nie łapie.

## Granice
Moduły dotknięte: `src/lib/tracker.ts` i test kontraktu.
Kontrakty dotknięte: controller ma domknąć async action flow po sklasyfikowanym błędzie zamiast wypuszczać rejection do event handlera.
Poza zakresem: przebudowa bannerów błędu, zmiana cloud/local wrappers, nowy globalny error bus.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: kontroler rozróżnia success od “classified failure”; błędne akcje nie zamykają dialogów, nie idą dalej jako unhandled rejection i nie wyglądają jak success.
ERRORS: action flow dalej odrzuca promise do UI albo po błędzie zamyka dialog jak po sukcesie.
STATUSES: PASS / FAIL.
SIDE EFFECTS: bez zmiany kontraktów backendu; tylko controller-level outcome handling.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: nie zmieniamy klasyfikacji błędów biznesowych; tylko ich propagation.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: bez zmiany semantics akcji poza tym, że po błędzie UI flow się domyka.
Concurrent request: `busyAction` pozostaje źródłem prawdy dla stanu trwającej akcji.
Partial write: po błędzie nie może dojść do efektów success-path jak zamknięcie dialogu czy czyszczenie formularza.
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
State machine: `run action -> success outcome -> success side effects` albo `run action -> failure outcome -> no success side effects`.
Error classification: akcja może zakończyć się `ok` albo `classified failure`.
Idempotency: bez zmiany.
Single-flight: bez zmiany, nadal `busyAction`.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: po błędzie dialog ma pozostać otwarty, a UI nie może wyglądać jakby akcja się udała.
Observability: test outcome helpera i lokalne gate'y.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/lib/tracker.ts`, `tests/app.test.tsx`
LOC: ~1500 / ~870
Dlaczego zmiana trafia tutaj: controller i action flow siedzą w `src/lib/tracker.ts`.
Czy plik ma wiele odpowiedzialności: tak.
Minimalny fix: mały helper outcome użyty przez istniejące handlery.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: średnie przez rozmiar plików, niskie funkcjonalnie przez wąski kontrakt.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `src/lib/tracker.ts`, `tests/app.test.tsx`
LOC: ~1500 / ~870
Obecne odpowiedzialności: controller, storage snapshoty, helpery UI i testy kontraktowe.
Czy task dokłada nową odpowiedzialność: nie.
Minimalny fix bez rozbicia: tak.
Małe wydzielenie odpowiedzialności: ewentualnie później, ale nie teraz.
Ryzyko minimalnego fixu: niskie-średnie.
Ryzyko wydzielenia: wysoki scope creep.
Rekomendacja: nie rozbijać teraz.

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
Co zmieniono: controller dostał mały helper outcome, który zamienia “classified failure” na kontrolowany wynik zamiast dalej odrzucać promise do event handlera. Success-path side effecty, jak zamknięcie dialogu czy czyszczenie formularza, uruchamiają się teraz tylko po prawdziwym `ok`.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local` (w tym `lint`, `typecheck`, `test`, `build`).
PASS / FAIL: PASS
Ryzyka: helper outcome domyka propagation dla controllera, ale nie wprowadza globalnej polityki telemetrycznej dla błędów; jeśli będziesz chciał później lepszą obserwowalność, to osobny task.
Follow-up: ewentualny osobny task na ujednolicenie nazewnictwa i kształtu wyników akcji, jeśli ten wzorzec zacznie się rozlewać szerzej.
