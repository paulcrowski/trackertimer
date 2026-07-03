# Archived Task

Closed At: 2026-07-03T17:52:29.358Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-private-local-indexeddb-storage
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Przenieść Private local z localStorage na IndexedDB z jawną migracją starego stanu i bez pozornego successu przy load/save failure.

## Kryteria sukcesu
- Private local ładuje i zapisuje stan przez IndexedDB

## Priorytet / Blocker
Największy blocker teraz: Przenieść Private local z localStorage na IndexedDB z jawną migracją starego stanu i bez pozornego successu przy load/save failure.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: local-tracker-persistence
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- src/App.tsx
- src/main.tsx
- src/lib/startupMode.ts
- src/lib/localTrackerStore.ts
- tests/app.test.tsx
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: local-tracker-persistence
Pliki: src/App.tsx, src/main.tsx, src/lib/startupMode.ts, src/lib/localTrackerStore.ts, tests/app.test.tsx

## Reprodukcja / dowód problemu
- `LocalTrackerApp` czytał i zapisywał cały stan `Private local` przez `localStorage`.
- Runtime local mode nie miał jawnego `loading` ani `fatal storage error`, więc problem z persistem mógł skończyć się pustym workspace albo dalszą pracą bez gwarancji zapisu.
- Istniejący użytkownicy local mode mogli mieć historię tylko w legacy kluczu `worktimer.local-state.v1`, więc przejście na nowy storage bez migracji groziło utratą danych.

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
Root cause: cały source of truth local mode siedział w jednym JSON blobie `localStorage`, a shell local mode traktował odczyt/zapis jak zawsze sukces.
Dowód: `LocalTrackerApp` bootował z `readLocalTrackerState()` i zapisywał każdą zmianę przez `writeLocalTrackerState(state)`; nowe testy potwierdzają migrację legacy stanu do `IndexedDB` i fail-closed przy corrupted persisted state.
Aktualny flow: `Private local` ładuje stan asynchronicznie z `IndexedDB`, migruje legacy `localStorage` przy pierwszym odczycie i przechodzi w blokujący stan błędu zamiast renderować pusty workspace przy load/save failure.

## Granice
Moduły dotknięte: local-tracker-persistence
Kontrakty dotknięte: bootstrap local mode, persistence local trackera, migracja legacy `localStorage` do `IndexedDB`, export local historii z runtime state.
Poza zakresem: startup chooser guard/copy dla `IndexedDB`, cloud auth, Convex, helper desktopowy.

## Kontrakt
INPUT: uruchomienie `Private local` z pustym stanem, legacy `localStorage` albo istniejącym persisted state.
SUCCESS: local tracker czyta i zapisuje stan przez `IndexedDB`, nie gubi legacy danych z `localStorage`, a przy błędzie storage nie pokazuje pustego success UI.
ERRORS: corrupted current state bez recoverable legacy kopii albo błąd zapisu przełączają runtime w jawny stan błędu.
STATUSES: `loading -> ready -> fatal storage error`.
SIDE EFFECTS: pierwszy poprawny load może zapisać migrated state do `IndexedDB` i wyczyścić legacy `localStorage`.
LOGS: `npm test`, `npm run typecheck`, `npm run gate:local`.
TESTS: migracja legacy stanu, fail-closed corrupted state, pełny gate lokalny.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak persisted state daje pusty local tracker dopiero po jawnym zakończeniu loadu.
Invalid schema: corrupted persisted state bez legacy recovery kończy się blocking error zamiast resetem do pustki.
Duplicate request: migracja legacy jest idempotentna, bo po pierwszym sukcesie źródłem prawdy staje się `IndexedDB`.
Concurrent request: zapisy local mode lecą przez kolejkę `persistQueueRef`, więc starszy write nie powinien nadpisać nowszego.
Partial write: błąd zapisu odcina workspace od dalszej pracy zamiast zostawiać pozorny sukces.
Worker crash: nie dotyczy.
Retry loop: nie dodawać retry bez klasyfikacji błędów.
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
State machine: `mount -> loading`; `loading -> ready` po odczycie `IndexedDB`; `loading/save -> fatal storage error` po błędzie odczytu lub zapisu.
Error classification: `IndexedDB unavailable/corrupted/write failed` to non-retryable local persistence error.
Idempotency: wielokrotny odczyt po udanej migracji zwraca ten sam persisted stan.
Single-flight: nie dotyczy dla odczytu; zapis serializowany przez jedną kolejkę promise.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: local workspace nie renderuje się przed zakończeniem loadu i nie renderuje się dalej po fatalnym błędzie storage.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/App.tsx`
LOC: ~645
Dlaczego zmiana trafia tutaj: `LocalTrackerApp` i jego runtime state siedzą już w tym pliku.
Czy plik ma wiele odpowiedzialności: tak, ale task nie dokłada nowego produktu, tylko podmienia persistence seam local mode.
Minimalny fix: asynchroniczny load/save i fail-closed UI tylko dla `LocalTrackerApp`.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym slicie.
Ryzyko: średnie, bo plik jest duży; zysk kontroli kontraktu przeważa nad kosztem małego dołożenia logiki.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `src/App.tsx`
LOC: ~645
Obecne odpowiedzialności: auth screen, local mode shell, cloud shell, loading states, runtime wiring.
Czy task dokłada nową odpowiedzialność: nie, persistence nadal dotyczy wyłącznie local mode.
Minimalny fix bez rozbicia: dodać osobny helper store i mały runtime state w istniejącym `LocalTrackerApp`.
Małe wydzielenie odpowiedzialności: `src/lib/localTrackerStore.ts`
Ryzyko minimalnego fixu: duży plik, ale ograniczony do jednego seama.
Ryzyko wydzielenia: małe, bo nowy helper jest bez UI i ma czysty kontrakt.
Rekomendacja: PASS dla tego slice'a, bez dalszego splitu App.tsx teraz.

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
Co zmieniono: local mode czyta i zapisuje stan przez `IndexedDB`; dodano helper migracji legacy `localStorage`; runtime `LocalTrackerApp` ma jawne stany `loading` i `fatal storage error`; local export używa bieżącego runtime state zamiast starego sync odczytu z `localStorage`.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local`.
PASS / FAIL: PASS
Ryzyka: startup chooser nadal sprawdza stary kontrakt `localStorage`; alignment startup guard/copy do `IndexedDB` idzie jako następny mały task.
Follow-up: osobny mały task na startup guard i copy dla `IndexedDB`.
