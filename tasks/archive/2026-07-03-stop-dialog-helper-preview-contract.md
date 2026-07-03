# Archived Task

Closed At: 2026-07-03T12:17:03.759Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-stop-dialog-helper-preview-contract
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Dialog STOP ma jawnie odrozniać helper preview od finalnie zapisywanej historii sesji.

## Kryteria sukcesu
- Dialog STOP nie sugeruje

## Priorytet / Blocker
Największy blocker teraz: Dialog STOP ma jawnie odrozniać helper preview od finalnie zapisywanej historii sesji.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: stop-dialog-ui-truth
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- convex/tracker.ts
- src/components/SessionDialogs.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: stop-dialog-ui-truth
Pliki: tasks/todo.md, convex/tracker.ts, src/components/SessionDialogs.tsx, tests/app.test.tsx

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
Root cause: po przywroceniu pojedynczego persistence kontraktu przy `STOP`, dialog nadal pokazuje helperowy timeline w tym samym miejscu co finalne potwierdzenie zapisu sesji, bez jasnego rozdzielenia tego od danych historii.
Dowód: `StopDialog` renderuje blok `Helper:` nad polem notatki i przyciskiem `Zapisz sesję`, ale backend `tracker.stop` zapisuje juz tylko jeden rekord sesji.
Aktualny flow: user otwiera STOP -> widzi helperowy timeline -> moze zalozyc, ze to element finalnego zapisu -> runtime zapisuje tylko jeden rekord historii.

## Granice
Moduły dotknięte: `src/components/SessionDialogs.tsx` i testy renderu kontraktu UI.
Kontrakty dotknięte: dialog `STOP` ma jasno mowic, ze helper preview sluzy tylko jako kontekst do notatki, nie jako finalny zapis historii.
Poza zakresem: wszystko poza allowlistą; `convex/tracker.ts` jest tu tylko jako odziedziczony diff z poprzedniego zamknietego slice'a, bez nowej zmiany w tym tasku.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: dialog `STOP` nie myli helper preview z finalnym persistence.
ERRORS: copy dalej sugeruje zapis helperowego timeline do historii albo zmiana wychodzi poza scope.
STATUSES: PASS / FAIL.
SIDE EFFECTS: helper preview zostaje jako informacja pomocnicza, ale traci pozor finalnego zapisu.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: gdy helper summary nie istnieje, dialog pozostaje prostym potwierdzeniem zapisu sesji.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: nie dotyczy.
Concurrent request: nie dotyczy.
Partial write: nie dotyczy, bo zmiana jest po stronie UI copy/render.
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
State machine: `open STOP dialog -> show helper preview as advisory only -> save single session`.
Error classification: helper preview jest pomocniczy i nie moze wygladac jak verified final result.
Idempotency: nie dotyczy.
Single-flight: do uzupełnienia, jeśli dotyczy.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: dialog STOP ma jawnie komunikowac, co zapisuje sie do historii, a co jest tylko podgladem helpera.
Observability: test renderu dialogu plus lokalne gate'y.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/components/SessionDialogs.tsx`, `tests/app.test.tsx`
LOC: ~420, ~600
Dlaczego zmiana trafia tutaj: falszywy kontrakt siedzi bezposrednio w copy/renderze dialogu STOP.
Czy plik ma wiele odpowiedzialności: tak, ale zmiana dotyczy jednego dialogu i jednego testu.
Minimalny fix: skorygowac copy i dodac test renderu.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: niskie.

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
Co zmieniono: dialog `STOP` przestal opisywac helperowy timeline jak element finalnego zapisu i jawnie oznacza go jako podglad pomocniczy; dodany test renderu tego kontraktu.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local` (w tym `lint`, `typecheck`, `test`, `build`).
PASS / FAIL: PASS
Ryzyka: helper preview nadal korzysta z ograniczonego zbioru aktywnosci i moze byc niedokladny jako analityka; ten task naprawia tylko falszywy kontrakt UI vs persistence.
Follow-up: osobny task na zrownanie helper preview z pelnym backendowym datasetem albo przeniesienie tej analityki poza flow `STOP`.
