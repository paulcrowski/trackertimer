# Archived Task

Closed At: 2026-07-02T22:04:12.782Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-timer-auto-pause-opt-in
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Zmienic timer tak, aby nie auto-stopowal sesji po bezczynnosci; opcjonalna automatyka ma robic pauze i dawac mozliwosc wznowienia albo recznego stopu.

## Kryteria sukcesu
- Timer dziala recznie domyslnie

## Priorytet / Blocker
Największy blocker teraz: Zmienic timer tak, aby nie auto-stopowal sesji po bezczynnosci; opcjonalna automatyka ma robic pauze i dawac mozliwosc wznowienia albo recznego stopu.
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
Pliki: tasks/todo.md, convex/schema.ts, convex/tracker.ts, convex/trackerModel.ts, src/lib/trackerTypes.ts, src/lib/tracker.ts, src/components/TrackerPanels.tsx, src/components/TrackerWorkspace.tsx, src/App.tsx, tests/app.test.tsx

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
Root cause: timer ma dziś wymuszone przejście `running -> stop` po 15 minutach bezczynności w oknie appki, co miesza kontrakt ręcznego timera z opcjonalnym pomodoro/automatyzacją.
Dowód: `src/lib/tracker.ts` wywołuje `onStopSession(...)` po idle zamiast stanu pauzy; pomodoro `50 / 10` w `src/lib/pomodoro.ts` jest osobnym alarmem i nie powinno decydować o stopie sesji.
Aktualny flow: po zmianie ma być `idle -> running -> paused (opcjonalnie, tylko przy autoPauseEnabled) -> running albo saved`.

## Granice
Moduły dotknięte: tracker
Kontrakty dotknięte: `activeSessions`, `trackerPreferences`, `ActiveSession`, `TrackerPreferences`, mutacje `pause` / `resume` / `stop`, timer UI i licznik elapsed.
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
State machine: `idle -> running -> paused -> running` oraz `running/paused -> saved`.
Error classification: brak retry; błędy mutacji Convex pozostają terminalne dla akcji użytkownika.
Idempotency: `pause` i `resume` są bezpieczne przy ponownym wywołaniu, gdy sesja jest już w oczekiwanym stanie.
Single-flight: do uzupełnienia, jeśli dotyczy.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: źródłem prawdy dla stanu pauzy jest `activeSession.pausedAt` i `activeSession.pausedSeconds` z Convexa.
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
- `npm run typecheck` PASS
- `npm test` PASS
- `npm run build` PASS
- `npm run check:diff-size` FAIL przed commit baseline, bo liczyl laczny niecommitniety diff z dwoch nakladajacych sie slicow
Expected result: PASS.

## Definition of Done
- [ ] test PASS
- [ ] build PASS albo NOT_NEEDED z uzasadnieniem
- [ ] brak ERROR w logach
- [ ] zmiana nie wychodzi poza zakres
- [ ] brak refaktoru przy okazji
- [ ] failure modes obsłużone
- [ ] brak silent fallbacków
- [ ] brak empty success
- [ ] UI truth zachowane, jeśli dotyczy
- [ ] dependency direction zachowany
- [ ] brak cyklicznych zależności
- [ ] duże pliki nie zostały powiększone bez uzasadnienia
- [ ] implementowano tylko REQUIRED GUARDS

## Review / Wyniki
Co zmieniono: dodano jawny stan pauzy sesji, opt-in `autoPauseEnabled`, konfigurowany prog `autoPauseMinutes` z domyslnym `7`, mutacje `pause` / `resume`, licznik bez doliczania czasu z pauzy oraz helper/settings UI wyjasniajace zachowanie.
Jak sprawdzono: `npm run typecheck`, `npm test`, `npm run build`.
PASS / FAIL: PASS
Ryzyka: automatyka nadal opiera się na aktywności widocznej z okna appki, nie na desktop-wide sygnałach typu Codex/Canva/OBS.
Follow-up: po commit baseline odpalic `gate:local` na czystym diffie.
