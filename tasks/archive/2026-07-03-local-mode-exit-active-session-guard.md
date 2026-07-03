# Archived Task

Closed At: 2026-07-03T13:04:27.210Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-local-mode-exit-active-session-guard
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Wyjście z private local nie może ukrywać aktywnego timera i zostawiać go bez sygnału poza aktualnym widokiem.

## Kryteria sukcesu
- Przy aktywnej sesji local exit do wyboru trybu jest blokowany jawnym komunikatem

## Priorytet / Blocker
Największy blocker teraz: Wyjście z private local nie może ukrywać aktywnego timera i zostawiać go bez sygnału poza aktualnym widokiem.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: local-mode-session-truth
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/components/TrackerWorkspace.tsx
- src/App.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: local-mode-session-truth
Pliki: tasks/todo.md, src/components/TrackerWorkspace.tsx, src/App.tsx, tests/app.test.tsx

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
Root cause: local mode zapisuje aktywną sesję do `localStorage` i pozwala wyjść do wyboru trybu bez żadnego guardu. UI mówi `Zmień tryb`, ale runtime może zostawić działający lokalny timer poza aktualnym widokiem.
Dowód: `LocalTrackerApp` zapisuje stan przez `writeLocalTrackerState(state)` na każdą zmianę, a `onSignOut` robi tylko `onExitLocalMode()`. W headerze ten sam przycisk jest opisany jako `Zmień tryb`.
Aktualny flow: aktywna sesja local -> klik `Zmień tryb` -> wracasz do wyboru runtime -> lokalny timer nadal istnieje w storage i może dalej naliczać czas bez widocznego kontekstu.

## Granice
Moduły dotknięte: `src/components/TrackerWorkspace.tsx`, `src/App.tsx` i test kontraktu.
Kontrakty dotknięte: wyjście z local mode nie może wyglądać jak neutralne przełączenie, jeśli zostawia aktywną sesję pracy.
Poza zakresem: cloud sign-out, kasowanie local state, nowy dialog confirm, przebudowa storage policy.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: przy aktywnej sesji local exit do wyboru trybu jest blokowany jawnym komunikatem; bez aktywnej sesji wyjście działa normalnie.
ERRORS: local exit dalej pozwala ukryć działający timer albo copy sugeruje bezpieczne przełączenie bez stopu.
STATUSES: PASS / FAIL.
SIDE EFFECTS: tylko UI/storage-mode guard; bez zmiany modelu local state.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak aktywnej sesji ma nie blokować wyjścia z local mode.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: wieloklik nie może obchodzić guardu.
Concurrent request: guard jest przed zmianą `storageMode`.
Partial write: nie może być stanu “local runtime ukryty, ale timer dalej leci”.
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
State machine: `local + activeSession -> show guard error, stay in local`; `local + no activeSession -> exit to mode choice`.
Error classification: aktywna sesja przy wyjściu z local mode to błąd kontraktu użytkownika, nie błąd storage.
Idempotency: kolejne kliknięcia przy aktywnej sesji utrzymują guard bez side effectu.
Single-flight: guard działa przed `onExitLocalMode`.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: copy i zachowanie local exit muszą być zgodne z tym, że aktywny timer nie może zniknąć z widoku bez stopu.
Observability: test helpera guardu i lokalne gate'y.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/components/TrackerWorkspace.tsx`, `src/App.tsx`, `tests/app.test.tsx`
LOC: ~390 / ~520 / ~840
Dlaczego zmiana trafia tutaj: istniejący sign-out guard już siedzi w workspace, a local label siedzi w app shellu.
Czy plik ma wiele odpowiedzialności: tak.
Minimalny fix: rozszerzyć istniejący guard helper zamiast tworzyć nowy subsystem.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: niskie.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `src/App.tsx`, `tests/app.test.tsx`
LOC: ~520 / ~840
Obecne odpowiedzialności: app shell/local mode i testy wielu kontraktów UI.
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
Co zmieniono: rozszerzono istniejący guard wyjścia tak, żeby local mode również blokował wyjście przy aktywnej sesji. Copy przycisku zmieniono z `Zmień tryb` na `Wyjdź do wyboru trybu`, żeby nie sugerować bezpiecznego przełączenia przy ukrytym timerze.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local` (w tym `lint`, `typecheck`, `test`, `build`).
PASS / FAIL: PASS
Ryzyka: guard jest po stronie UI, więc nie zatrzyma ręcznej manipulacji `localStorage`; na ten scope usuwa jednak fałszywy kontrakt produktu.
Follow-up: jeśli chcesz twardszą politykę, osobny task na jawne `pause/stop` workflow przy wyjściu z local mode.
