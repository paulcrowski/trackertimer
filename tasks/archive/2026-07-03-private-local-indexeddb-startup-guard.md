# Archived Task

Closed At: 2026-07-03T17:54:15.738Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-private-local-indexeddb-startup-guard
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Zgrać startup chooser z nowym kontraktem Private local na IndexedDB zamiast localStorage.

## Kryteria sukcesu
- Startup availability i copy dla Private local odnoszą się do IndexedDB

## Priorytet / Blocker
Największy blocker teraz: Zgrać startup chooser z nowym kontraktem Private local na IndexedDB zamiast localStorage.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: startup-mode-choice
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- src/lib/startupMode.ts
- src/main.tsx
- tests/app.test.tsx
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: startup-mode-choice
Pliki: src/lib/startupMode.ts, src/main.tsx, tests/app.test.tsx

## Reprodukcja / dowód problemu
- Po migracji local runtime na `IndexedDB` startup chooser nadal oceniał dostępność `Private local` przez stary kontrakt `localStorage`.
- Efekt: entry copy i disabled state obiecywały inny storage niż ten, którego naprawdę używa local mode.

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
Root cause: startup helper `getLocalModeStorageError()` nadal sprawdzał zapisywalny `localStorage`, mimo że local tracker persistence przeszła już na `IndexedDB`.
Dowód: test startup guard teraz sprawdza `IndexedDB` availability boolean, a copy entry screena mówi wprost o `IndexedDB`.
Aktualny flow: startup chooser traktuje `Private local` jako dostępne tylko przy wsparciu `IndexedDB`; gdy go brak, user widzi prawdziwy powód w copy.

## Granice
Moduły dotknięte: startup-mode-choice
Kontrakty dotknięte: startup availability `Private local`, disabled-state copy, test kontraktu startowego.
Poza zakresem: runtime local mode, migracja `IndexedDB`, cloud auth.

## Kontrakt
INPUT: startup z chooserem i wykryciem storage support dla `Private local`.
SUCCESS: startup availability i copy dla `Private local` odnoszą się do `IndexedDB`, nie do legacy `localStorage`.
ERRORS: entry screen dalej komunikuje nieaktualny storage kontrakt.
STATUSES: startup local available / startup local unavailable.
SIDE EFFECTS: brak zmian w runtime local mode ani danych użytkownika.
LOGS: `npm test`, `npm run typecheck`, `npm run gate:local`.
TESTS: jednostkowy test startup guard i pełny gate lokalny.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak `IndexedDB` support blokuje local entry z jawnym komunikatem.
Invalid schema: nie dotyczy.
Duplicate request: ponowne wejście w chooser daje ten sam wynik dla tego samego środowiska.
Concurrent request: nie dotyczy.
Partial write: nie dotyczy, task nie zapisuje danych trackera.
Worker crash: nie dotyczy.
Retry loop: nie dotyczy.
Provider unavailable: nie dotyczy.

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
State machine: `startup -> chooser`; `chooser -> local enabled` przy wsparciu `IndexedDB`; `chooser -> local disabled + copy` bez wsparcia `IndexedDB`.
Error classification: brak `IndexedDB` support to non-retryable environment limitation dla local entry.
Idempotency: helper startup guard jest czysto pochodny i deterministyczny.
Single-flight: nie dotyczy.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: entry copy musi nazywać dokładnie ten storage, którego używa runtime local mode.
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
Co zmieniono: startup helper sprawdza teraz availability `Private local` przez `IndexedDB`, entry copy mówi o `IndexedDB`, a test kontraktu startowego nie odwołuje się już do `localStorage`.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local`.
PASS / FAIL: PASS
Ryzyka: brak dalszych runtime ryzyk w tym seamie; to tylko alignment startup truth z już wdrożonym local persistence.
Follow-up: brak.
