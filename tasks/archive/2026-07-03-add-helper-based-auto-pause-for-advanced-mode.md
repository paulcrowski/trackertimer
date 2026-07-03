# Archived Task

Closed At: 2026-07-03T11:46:19.687Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-add-helper-based-auto-pause-for-advanced-mode
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Dodac prawdziwa auto-pauze w advanced mode na podstawie ciszy z helpera desktop, zamiast bezczynnosci tylko tego okna.

## Kryteria sukcesu
- Advanced mode pauzuje aktywna sesje po progu ciszy z helpera
- Simple mode dalej uzywa bezczynnosci okna worktimera
- UI rozroznia `bezczynnosc okna` i `cisze helpera`

## Priorytet / Blocker
Największy blocker teraz: Dodac prawdziwa auto-pauze w advanced mode na podstawie ciszy z helpera desktop, zamiast bezczynnosci tylko tego okna.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: tracker+desktop-helper+ui-state
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/lib/tracker.ts
- src/components/TrackerWorkspace.tsx
- src/components/TrackerPanels.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: tracker+desktop-helper+ui-state
Pliki: tasks/todo.md, src/lib/tracker.ts, src/components/TrackerWorkspace.tsx, src/components/TrackerPanels.tsx, tests/app.test.tsx

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
Root cause:
- Po poprzednim fixie advanced mode nie mial juz falszywej auto-pauzy z okna, ale nadal nie mial zadnego prawdziwego mechanizmu inactivity poza oknem.
- Helper wysyla heartbeat co `5000ms`, a frontend mial wystarczajace dane (`lastSeenAt`, `desktopTrackingEnabled`, `desktopTrackingManualPause`, `desktopTrackingPausedUntil`), zeby bezpiecznie wykryc cisze helpera bez zmian backendu.
Dowód:
- `scripts/desktop-helper.mjs:18-39` uruchamia loop z domyslnym `intervalMs=5000`.
- `src/lib/tracker.ts` mial juz live `desktopHelper.lastSeenAt`, ale nie wykorzystywal go do auto-pauzy sesji.
Aktualny flow:
- `simple`: auto-pauza po bezczynnosci tego okna.
- `advanced`: auto-pauza po progu ciszy z helpera desktop, o ile tracking helpera jest wlaczony i nie jest recznie spauzowany.

## Granice
Moduły dotknięte: tracker+desktop-helper+ui-state
Kontrakty dotknięte:
- auto-pause source zależny od trybu pracy
- helper heartbeat -> session pause contract
- UI truth dla simple vs advanced
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS:
- advanced mode może pauzować po helper inactivity
- simple mode zachowuje dotychczasową auto-pauzę okna
- advanced mode nie odpala auto-pauzy, jeśli helper tracking jest wyłączony albo ręcznie spauzowany
- UI pokazuje poprawne copy dla obu trybów
ERRORS: brak dowodu, zmiana poza scope albo failujące gate'y.
STATUSES: PASS / FAIL.
SIDE EFFECTS: tylko zmiany w plikach z allowlisty.
LOGS: komendy weryfikacyjne.
TESTS:
- `npm run typecheck`
- `npm test`
- `npm run build`
- browser smoke simple local path
- render/unit proof dla advanced helper path
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
State machine:
- simple + `autoPauseEnabled=true` -> idle listener okna
- advanced + `autoPauseEnabled=true` + helper coverage -> helper silence monitor
- advanced + helper paused/disabled -> brak auto-pauzy helpera
Error classification:
- brak helper heartbeat w advanced to runtime signal do pauzy, nie błąd providera
- brak helper coverage dla sesji to brak dowodu do auto-pauzy, więc fail-closed bez pauzowania
Idempotency:
- ponowne ticki helper silence nie mogą wywołać wielu pauz naraz; blokuje to `autoPauseInFlight`
Single-flight: nie dotyczy
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth:
- advanced pokazuje `cisze helpera`, simple pokazuje `bezczynnosc`
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
- `npm run typecheck`
- `npm test`
- `npm run build`
- Playwright smoke na local simple path
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
Co zmieniono:
- dodano helper-based auto-pause decision logic w `src/lib/tracker.ts`
- `TrackerWorkspace` przekazuje teraz źródło auto-pauzy zależne od trybu
- `TimerPanel` rozróżnia `Auto-pauza` i `Auto-pauza helpera` oraz `Bezczynnosc` vs `Cisza helpera`
- dodano testy logiki i render proof dla advanced mode
Jak sprawdzono:
- `npm run typecheck`
- `npm test`
- `npm run build`
- Playwright smoke dla local simple path
- unit/render proof dla advanced helper path
PASS / FAIL: PASS
Ryzyka:
- browser smoke nie odtworzył pełnego live helper ingestion end-to-end, bo local private path nie montuje helper runtime
Follow-up:
- jeśli chcesz, następnym krokiem może być pełny e2e cloud smoke z prawdziwym helperem i `VITE_CONVEX_URL`
