# Archived Task

Closed At: 2026-07-03T13:09:26.125Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-local-mode-error-surface
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Local mode ma pokazywać użytkownikowi lokalne błędy walidacji i akcji zamiast kończyć się bez czytelnego feedbacku.

## Kryteria sukcesu
- Błędy local mode trafiają do istniejącego bannera error i nie wyglądają jak pozorny brak reakcji UI.

## Priorytet / Blocker
Największy blocker teraz: Local mode ma pokazywać użytkownikowi lokalne błędy walidacji i akcji zamiast kończyć się bez czytelnego feedbacku.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: local-error-truth
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/App.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: local-error-truth
Pliki: tasks/todo.md, src/App.tsx, tests/app.test.tsx

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
Root cause: `LocalTrackerApp` ma własny stan `error`, ale lokalne akcje prawie nigdy go nie ustawiają. Gdy walidacja albo stan lokalny rzuca błędem, użytkownik może nie dostać czytelnego feedbacku w istniejącym bannerze błędu.
Dowód: w `LocalTrackerApp` prawie wszystkie handlery robią bezpośredni `updateState(...)` i rzucają `Error`, ale tylko `onClearError` dotyka `setError`. Dla porównania cloud handlery łapią błąd i ustawiają `setError(message)`.
Aktualny flow: np. ręczna sesja z nieprawidłową godziną albo lokalna akcja na złym stanie -> throw -> brak jawnego kanału UI w local mode -> użytkownik dostaje co najwyżej brak reakcji albo techniczny błąd poza produktem.

## Granice
Moduły dotknięte: `src/App.tsx` i test kontraktu.
Kontrakty dotknięte: local mode ma przepchnąć lokalne błędy akcji do istniejącego `error` bannera.
Poza zakresem: pełne unhandled rejection cleanup w controllerze, cloud error flow, nowy globalny subsystem błędów.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: lokalne błędy akcji ustawiają `error` state w `LocalTrackerApp`, więc UI ma jawny komunikat zamiast pozornego braku reakcji.
ERRORS: local mode dalej rzuca błędy bez ustawienia UI error state.
STATUSES: PASS / FAIL.
SIDE EFFECTS: bez zmiany modelu danych; tylko wspólny wrapper local actions.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: błędne lub brakujące dane local action mają iść do error bannera, nie do ciszy.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: bez nowych side effectów poza ustawieniem tego samego błędu.
Concurrent request: nie zmieniamy state machine akcji, tylko surface błędu.
Partial write: lokalna porażka nie może wyglądać jak neutralny brak reakcji UI.
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
State machine: `local action -> success` albo `local action -> set error message -> reject`.
Error classification: to lokalne błędy walidacji/stanu, nie błąd backendu.
Idempotency: ten sam błąd może być nadpisany tą samą wiadomością bez nowego side effectu biznesowego.
Single-flight: bez zmian w busyAction/controller flow.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: local mode nie może mieć ukrytych błędów, skoro ma już banner error.
Observability: test wrappera błędu i lokalne gate'y.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/App.tsx`, `tests/app.test.tsx`
LOC: ~520 / ~850
Dlaczego zmiana trafia tutaj: local mode handlery i lokalny error state siedzą w `src/App.tsx`.
Czy plik ma wiele odpowiedzialności: tak.
Minimalny fix: mały helper wrappera błędów użyty tylko w local mode.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: niskie.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `src/App.tsx`, `tests/app.test.tsx`
LOC: ~520 / ~850
Obecne odpowiedzialności: auth/local/cloud app shell i testy kontraktowe.
Czy task dokłada nową odpowiedzialność: nie; domyka istniejący local error contract.
Minimalny fix bez rozbicia: tak.
Małe wydzielenie odpowiedzialności: opcjonalne później.
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
Co zmieniono: local mode używa teraz wspólnego wrappera błędu, który przepycha lokalne błędy akcji do istniejącego `error` bannera zamiast zostawiać je bez czytelnego feedbacku. Wrapper jest użyty przez ręczne wpisy, start/stop, pause/resume, preferencje, delete i exit z local mode.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local` (w tym `lint`, `typecheck`, `test`, `build`).
PASS / FAIL: PASS
Ryzyka: ten slice poprawia user-facing error surface, ale nie zamyka jeszcze całkowicie kanału unhandled promise rejection w warstwie controllera; to osobny follow-up techniczny, jeśli będzie potrzebny.
Follow-up: osobny task, jeśli chcesz ujednolicić także controller-level rejection handling dla cloud i local.
