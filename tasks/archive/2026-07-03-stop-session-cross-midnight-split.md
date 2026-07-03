# Archived Task

Closed At: 2026-07-03T12:38:39.835Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-stop-session-cross-midnight-split
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Aktywna sesja zatrzymana po północy ma zapisać poprawny timeline i poprawne dni pracy, bez niemożliwych godzin.

## Kryteria sukcesu
- STOP sesji po północy nie zapisuje rekordu z datą dnia startu i stopTime z kolejnego dnia.

## Priorytet / Blocker
Największy blocker teraz: Aktywna sesja zatrzymana po północy ma zapisać poprawny timeline i poprawne dni pracy, bez niemożliwych godzin.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: stop-midnight-contract
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- convex/tracker.ts
- convex/trackerModel.ts
- src/App.tsx
- src/lib/trackerTypes.ts
- src/components/SessionDialogs.tsx
- src/components/SessionsPanel.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: stop-midnight-contract
Pliki: tasks/todo.md, convex/tracker.ts, convex/trackerModel.ts, src/App.tsx, src/lib/trackerTypes.ts, src/components/SessionDialogs.tsx, src/components/SessionsPanel.tsx, tests/app.test.tsx

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
Root cause: runtime `STOP` buduje rekord sesji tylko z `date=startDay`, `startTime`, `stopTime`, bez osobnego dnia zakonczenia, wiec sesja przechodzaca przez polnoc ląduje jako niemożliwy rekord z datą dnia startu i godziną stopu z kolejnego dnia.
Dowód: backend `buildStoppedSessionRecord()` i local mode `onStopSession` składają rekord z `toLocalDateString(startTime)` oraz `toLocalTimeString(endTime)` niezależnie od zmiany dnia.
Aktualny flow: start przed północą -> stop po północy -> jeden rekord z błędnym timeline -> summary/history przypisują czas do złego dnia.

## Granice
Moduły dotknięte: `convex/trackerModel.ts`, `convex/tracker.ts`, `src/App.tsx` i testy kontraktu.
Kontrakty dotknięte: aktywna sesja przechodząca przez północ ma zostać rozcięta na poprawne rekordy dzienne przy `STOP`.
Poza zakresem: ręczne add/edit sesji przez północ, nowy model absolutnych timestampów i przebudowa historii.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: `STOP` po północy nie produkuje niemożliwego pojedynczego rekordu; zapis dzieli sesję na spójne rekordy dzienne.
ERRORS: dalej pojawia się rekord z `date` dnia startu i `stopTime` po północy albo zmiana wychodzi poza scope.
STATUSES: PASS / FAIL.
SIDE EFFECTS: jedno `STOP` może zapisać więcej niż jeden rekord tylko wtedy, gdy sesja przechodzi przez granicę dnia.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak aktywnej sesji lub nieprawidłowy `endTime` dalej mają failować jawnie.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: drugi `stop` po sukcesie nadal ma failować na braku aktywnej sesji.
Concurrent request: bez nowego wyścigu; nadal jedna mutacja Convexa.
Partial write: split dzienny ma zachować sumę czasu i nie może gubić sekund ani tworzyć ujemnych odcinków.
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
State machine: `activeSession -> detect same-day or cross-midnight -> build one or many daily records -> persist -> delete activeSession`.
Error classification: cross-midnight to legalny wariant flow, nie błąd użytkownika.
Idempotency: bez nowego klucza; kontrakt pozostaje single-shot.
Single-flight: do uzupełnienia, jeśli dotyczy.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: historia po STOP ma pokazywać realne dni pracy zamiast niemożliwych godzin.
Observability: testy helpera splitu i lokalne gate'y.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `convex/trackerModel.ts`, `convex/tracker.ts`, `src/App.tsx`, `tests/app.test.tsx`
LOC: ~310 / ~1000 / ~520 / ~670
Dlaczego zmiana trafia tutaj: to jedyne miejsce, gdzie aktywna sesja jest materializowana do rekordów historii.
Czy plik ma wiele odpowiedzialności: tak, szczególnie `convex/tracker.ts`, `src/App.tsx` i test file.
Minimalny fix: dodać współdzielony helper splitu dziennego i użyć go w cloud/local STOP.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: średnie, bo dotykamy czasu i agregacji.

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
Co zmieniono: `STOP` korzysta teraz ze wspólnego helpera, który rozcina aktywną sesję na poprawne rekordy dzienne tylko wtedy, gdy sesja przechodzi przez północ; ten sam kontrakt działa w Convex i w local mode.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local` (w tym `lint`, `typecheck`, `test`, `build`).
PASS / FAIL: PASS
Ryzyka: ręczne add/edit nadal mogą wprowadzić międzydniowy rekord, bo ten task naprawia wyłącznie runtime `STOP`; to świadomie poza zakresem.
Follow-up: osobny task, jeśli chcesz uszczelnić również manualne drafty/edycję sesji wobec kontraktu jednej doby.
