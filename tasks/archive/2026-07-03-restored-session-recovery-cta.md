# Archived Task

Closed At: 2026-07-03T13:44:05.889Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-restored-session-recovery-cta
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Lokalnie przywrócona sesja bez rekordu na backendzie musi dawać użytkownikowi jawny recovery path zamiast martwego timera.

## Kryteria sukcesu
- Po błędzie stop dla local-restore UI daje jawny recovery CTA albo porzucenie przywrócenia bez fałszywego aktywnego stanu.

## Priorytet / Blocker
Największy blocker teraz: Lokalnie przywrócona sesja bez rekordu na backendzie musi dawać użytkownikowi jawny recovery path zamiast martwego timera.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: restored-session-recovery
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/lib/tracker.ts
- src/components/TrackerWorkspace.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: restored-session-recovery
Pliki: tasks/todo.md, src/lib/tracker.ts, src/components/TrackerWorkspace.tsx, tests/app.test.tsx

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
Root cause: lokalnie przywrócona aktywna sesja jest tylko fallbackiem z `localStorage`, ale `handleStopConfirm()` próbował kończyć ją wyłącznie przez `onStopSession()` do Convexa. Gdy rekord `activeSessions` zniknął na backendzie, UI kończyło się na zwykłym błędzie bez recovery path.
Dowód: `resolveActiveSessionState()` potrafi wystawić `source: 'local'`, a `handleStopConfirm()` przed tym taskiem po `!stopResult.ok` robił tylko `return false`, zostawiając użytkownika z martwym timerem i bez akcji odzyskania.
Aktualny flow: local restore -> użytkownik klika STOP -> backend zwraca `Brak aktywnej sesji do zatrzymania.` -> UI pokazuje błąd, ale aktywna sesja dalej wygląda na żywą i nie ma jawnego sposobu jej odzyskania albo porzucenia.

## Granice
Moduły dotknięte: `src/lib/tracker.ts`, `src/components/TrackerWorkspace.tsx` i testy kontraktu.
Kontrakty dotknięte: local restore nie może kończyć się martwym timerem; po błędzie STOP użytkownik dostaje jawny recovery path albo porzucenie przywróconego stanu.
Poza zakresem: pełny eksport historii, backendowy model sesji, automatyczna obsługa manual cross-midnight jako capability.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: stop dla lokalnie przywróconej sesji bez rekordu backendowego prowadzi do jawnego bannera recovery; jeśli sesja mieści się w jednej dobie, użytkownik może zapisać ją ręcznie; w przeciwnym razie może bezpiecznie porzucić przywrócenie.
ERRORS: martwy timer zostaje aktywny bez akcji recovery albo UI obiecuje zapis ręczny dla sesji przez północ.
STATUSES: PASS / FAIL.
SIDE EFFECTS: lokalny snapshot może zostać wyczyszczony po świadomym recovery albo porzuceniu.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`, `npm run gate:local`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: nie zgadywać, użyć ESCALATION.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: sprawdzić idempotencję, jeśli task ma side effecty.
Concurrent request: jeśli serwer jednak odda aktywną sesję przy kolejnym bootstrapie, stan serwera ma wygrać nad lokalnym recovery.
Partial write: po błędzie STOP użytkownik nie może zostać z aktywnym timerem bez przycisku odzyskania albo porzucenia.
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
State machine: `server active -> normal stop`; `local restored + missing backend row -> recovery banner`; `recovery manual save -> clear snapshot`; `discard recovery -> clear snapshot`.
Error classification: tylko błąd `Brak aktywnej sesji do zatrzymania.` przy `source === 'local'` otwiera recovery flow; inne błędy nadal zostają zwykłym error surface.
Idempotency: wielokrotne porzucenie recovery tylko czyści snapshot i nie zapisuje danych.
Single-flight: recovery reuse dalej siedzi za istniejącym `busyAction`.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: banner pokazuje zapis ręczny tylko wtedy, gdy sesja mieści się w jednej dobie; dla sesji przez północ zostaje tylko uczciwe porzucenie + instrukcja.
Observability: test `ActionOutcome`, test `createRecoveredSessionDraft`, pełny `gate:local`.

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
Co zmieniono: controller rozpoznaje błąd STOP dla lokalnie przywróconej sesji bez rekordu backendowego, zamyka martwy dialog STOP i pokazuje banner recovery. Jeśli sesja mieści się w jednej dobie, użytkownik może otworzyć gotowy ręczny draft i po zapisie snapshot znika; jeśli sesja przeszła przez północ, UI nie udaje capability i pozwala tylko porzucić przywrócenie.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local`
PASS / FAIL: PASS
Ryzyka: to nadal nie implementuje pełnego capability dla ręcznego odzyskania sesji przez północ; taki przypadek kończy się uczciwym porzuceniem lokalnego restore i wymaga osobnego taska capability.
Follow-up: osobny task na pełny eksport historii oraz osobny task capability, jeśli chcesz odzyskiwać ręcznie również sesje przez północ.
