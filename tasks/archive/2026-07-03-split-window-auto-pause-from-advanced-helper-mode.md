# Archived Task

Closed At: 2026-07-03T11:40:02.951Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-split-window-auto-pause-from-advanced-helper-mode
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Rozdzielic auto-pauze okna od zaawansowanego helper mode, zeby advanced nie pauzowal sesji tylko dlatego, ze okno worktimera jest w tle.

## Kryteria sukcesu
- Prosty mode zachowuje auto-pauze okna
- Advanced mode nie auto-pauzuje sesji po eventach tylko z okna worktimera
- UI jasno komunikuje, że auto-pauza okna dotyczy tylko prostego timera

## Priorytet / Blocker
Największy blocker teraz: Rozdzielic auto-pauze okna od zaawansowanego helper mode, zeby advanced nie pauzowal sesji tylko dlatego, ze okno worktimera jest w tle.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: tracker+ui-state
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/components/TrackerWorkspace.tsx
- src/components/TrackerPanels.tsx
- src/lib/tracker.ts
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: tracker+ui-state
Pliki: tasks/todo.md, src/components/TrackerWorkspace.tsx, src/components/TrackerPanels.tsx, src/lib/tracker.ts, tests/app.test.tsx

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
- `useTrackerWorkspaceController` uruchamiał auto-pauzę wyłącznie z eventów `window`, bez rozróżnienia prostego timera i advanced helper mode.
- `TimerPanel` pokazywał ten sam kontrakt auto-pauzy w obu trybach, mimo że advanced flow ma działać także poza oknem worktimera.
Dowód:
- `src/lib/tracker.ts:950+` przed fixem podpinał `mousemove/keydown/click/scroll/touchstart` zawsze, gdy `autoPauseEnabled=true`.
- `src/components/TrackerPanels.tsx:185+` przed fixem pokazywał identyczne CTA i copy auto-pauzy niezależnie od `workspaceMode`.
Aktualny flow:
- `simple`: auto-pauza może reagować na bezczynność tego okna.
- `advanced`: helper działa poza oknem, więc auto-pauza okna jest tylko zapisaną preferencją dla prostego timera i nie zatrzymuje sesji.

## Granice
Moduły dotknięte: tracker+ui-state
Kontrakty dotknięte:
- mode-specific auto-pause contract
- UI truth dla simple vs advanced timer flow
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS:
- simple mode zachowuje dotychczasową auto-pauzę okna
- advanced mode nie ma cichej auto-pauzy z eventów tego okna
- UI nie sugeruje, że advanced mode pilnuje bezczynności poza worktimerem przez ten sam mechanizm
ERRORS: brak dowodu, zmiana poza scope albo failujące gate'y.
STATUSES: PASS / FAIL.
SIDE EFFECTS: tylko zmiany w plikach z allowlisty.
LOGS: komendy weryfikacyjne.
TESTS:
- `npm run typecheck`
- `npm test`
- `npm run build`
- Playwright smoke: local mode -> włącz auto-pauzę w simple -> przełącz na advanced -> sprawdź disabled state i copy
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
- simple + autoPauseEnabled -> window idle listener aktywny
- advanced -> window idle listener wyłączony niezależnie od zapisanej preferencji
Error classification:
- błędny kontrakt UI/runtime to `UI truth` bug, nie backend/helper crash
Idempotency:
- przełączanie simple/advanced nie zmienia zapisanej preferencji auto-pauzy, tylko aktywność mechanizmu
Single-flight: nie dotyczy
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth:
- advanced mode pokazuje, że auto-pauza okna jest tylko dla prostego timera
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
- Playwright smoke na `http://127.0.0.1:4173/`
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
- auto-pauza okna jest teraz aktywna tylko w prostym timerze
- advanced mode blokuje ten mechanizm i pokazuje uczciwe copy o helperze poza oknem
- zapis preferencji auto-pauzy zostaje zachowany dla prostego trybu
Jak sprawdzono:
- `npm run typecheck`
- `npm test`
- `npm run build`
- Playwright smoke: local mode, włączenie auto-pauzy w simple, przełączenie na advanced, sprawdzenie disabled state i copy
PASS / FAIL: PASS
Ryzyka:
- advanced mode nadal nie ma osobnego auto-stop/auto-pause z helper activity; ten task tylko usuwa mylący window-based behavior
Follow-up:
- jeśli chcesz, następnym krokiem może być osobny kontrakt: czy advanced ma kiedyś pauzować po helper inactivity, czy ma zostać w pełni ręczny
