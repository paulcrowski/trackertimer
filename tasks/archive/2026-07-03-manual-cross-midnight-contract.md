# Archived Task

Closed At: 2026-07-03T13:17:19.148Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-manual-cross-midnight-contract
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Ręczne dodawanie i edycja nie mogą obiecywać zakresu czasu, którego runtime nie umie zapisać w spójnym modelu dnia.

## Kryteria sukcesu
- Manual add/edit jawnie komunikuje kontrakt jednej doby albo zapisuje taki przypadek poprawnie

## Priorytet / Blocker
Największy blocker teraz: Ręczne dodawanie i edycja nie mogą obiecywać zakresu czasu, którego runtime nie umie zapisać w spójnym modelu dnia.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: manual-session-midnight-truth
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/components/SessionDialogs.tsx
- src/App.tsx
- convex/trackerModel.ts
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: manual-session-midnight-truth
Pliki: tasks/todo.md, src/components/SessionDialogs.tsx, src/App.tsx, convex/trackerModel.ts, tests/app.test.tsx

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
Root cause: ręczny wpis i edycja zbierają tylko jeden `date` i dwie godziny, a helper `buildSessionRecord()` interpretuje oba timestampy w tej samej dobie. Runtime nie wspiera więc ręcznej sesji przechodzącej przez północ, ale formularz tego nie mówi, a błąd wygląda jak zwykła walidacja czasu.
Dowód: `SessionForm` pokazuje tylko `Data`, `Start`, `Koniec` bez informacji o jednej dobie, a `buildSessionRecord()` porównuje `parseSessionTime(args.date, args.startTime)` z `parseSessionTime(args.date, args.stopTime)` i kończy się ogólnym błędem przy `stop <= start`.
Aktualny flow: użytkownik wpisuje np. `23:50 -> 00:20` dla jednej daty -> runtime odrzuca wpis -> UI nie tłumaczy, że model ręcznych wpisów wymaga rozbicia na dwa rekordy.

## Granice
Moduły dotknięte: `src/components/SessionDialogs.tsx`, `convex/trackerModel.ts` i test kontraktu.
Kontrakty dotknięte: manual add/edit ma jawnie komunikować kontrakt jednej doby; runtime error ma prowadzić użytkownika do poprawnego obejścia.
Poza zakresem: automatyczny split ręcznej edycji na dwa rekordy, migracja modelu danych, zmiana backendu `updateSession` na operację multi-record.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: formularz i błąd walidacji mówią wprost, że ręczna sesja działa tylko w ramach jednej doby i sesję przez północ trzeba rozbić na dwa wpisy.
ERRORS: UI dalej wygląda jakby obsługiwał ręczne przejście przez północ albo błąd pozostaje mylący.
STATUSES: PASS / FAIL.
SIDE EFFECTS: bez zmiany capability; to truthfulness fix, nie rozbudowa modelu.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: bez zmian; nadal failuje walidacja czasu/daty.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: nie dotyczy.
Concurrent request: nie dotyczy.
Partial write: użytkownik nie może dostać pustego “nie działa”, tylko jasną instrukcję rozbicia wpisu.
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
State machine: `manual same-day -> normal save`; `manual cross-midnight -> explicit validation error with split guidance`.
Error classification: przejście przez północ w ręcznym wpisie to niewspierany capability edge case, nie losowy błąd czasu.
Idempotency: bez zmian.
Single-flight: bez zmian.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: formularz nie może obiecywać więcej niż runtime naprawdę zapisuje.
Observability: test copy formularza i test komunikatu walidacji.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/components/SessionDialogs.tsx`, `tests/app.test.tsx`
LOC: ~420 / ~930
Dlaczego zmiana trafia tutaj: kontrakt manualnego formularza siedzi w dialogu, a test w pliku integracyjnym.
Czy plik ma wiele odpowiedzialności: tak.
Minimalny fix: dodać copy i zmienić komunikat walidacji.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: niskie.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `tests/app.test.tsx`
LOC: ~930
Obecne odpowiedzialności: testy kontraktowe wielu paneli i helperów.
Czy task dokłada nową odpowiedzialność: nie.
Minimalny fix bez rozbicia: tak.
Małe wydzielenie odpowiedzialności: niepotrzebne teraz.
Ryzyko minimalnego fixu: niskie.
Ryzyko wydzielenia: zbędny scope creep.
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
Co zmieniono: formularz ręcznego dodawania i edycji mówi wprost, że zapis działa tylko w ramach jednej doby, a walidacja dla sesji przez północ prowadzi użytkownika do rozbicia jej na dwa wpisy zamiast zwracać mylący ogólny błąd czasu.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local`
PASS / FAIL: PASS
Ryzyka: runtime nadal nie wspiera ręcznego zapisu jednej sesji przez północ jako dwóch rekordów; to celowy truthfulness fix bez zmiany modelu danych.
Follow-up: osobny task, jeśli produkt ma realnie wspierać ręczne dodanie lub edycję sesji przechodzącej przez północ.
