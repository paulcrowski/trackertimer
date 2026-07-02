# Archived Task

Closed At: 2026-07-02T22:54:38.239Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-helper-simple-ux-v2
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Dodac prosty UX helpera v2: lista i usuwanie reguł, czytelniejszy status ostatniej aktywnosci oraz prostszy start sesji z helpera.

## Kryteria sukcesu
- Uzytkownik widzi zapisane reguly

## Priorytet / Blocker
Największy blocker teraz: Dodac prosty UX helpera v2: lista i usuwanie reguł, czytelniejszy status ostatniej aktywnosci oraz prostszy start sesji z helpera.
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
- convex/tracker.ts
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
Pliki: tasks/todo.md, convex/tracker.ts, src/lib/trackerTypes.ts, src/lib/tracker.ts, src/components/TrackerPanels.tsx, src/components/TrackerWorkspace.tsx, src/App.tsx, tests/app.test.tsx

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
Root cause: helper miał już ingest, sugestię projektu i privacy controls, ale z perspektywy użytkownika nadal brakowało zwykłej obsługi reguł i prostego startu pracy z aktualnego kontekstu helpera.
Dowód: UI nie pokazywał listy zapisanych reguł, nie pozwalał ich usuwać ani edytować przez prosty prefill, a start sesji nadal wymagał ręcznego wejścia w timer mimo aktywnego kontekstu helpera.
Aktualny flow: bootstrap zwraca sugestię i listę reguł, użytkownik może usunąć regułę albo wziąć ją do prostej edycji, widzi czytelniejszy status helpera i może uruchomić sesję bezpośrednio z helpera.

## Granice
Moduły dotknięte: tracker
Kontrakty dotknięte: `bootstrap`, mutacja `deleteTrackingRule`, typy `TrackerBootstrap`/`TrackerWorkspaceHandlers`, panel helpera i controller startu sesji.
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
State machine: helper bez aktywności -> quick start disabled; helper z aktywnością -> quick start available; reguła na liście -> edycja przez prefill albo delete; zapis reguły dla tej samej pary app/domain nadal nadpisuje projekt zamiast mnożyć duplikaty.
Error classification: delete fail-closed, jeśli reguła nie należy do użytkownika; quick start bez helper contextu nie jest udawany, tylko blokowany po stronie UI.
Idempotency: `saveTrackingRule` aktualizuje istniejącą regułę tej samej pary app/domain; `deleteTrackingRule` jest bezpieczny tylko dla właściciela.
Single-flight: zapis i usuwanie reguł są blokowane przez `busyAction`.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: panel helpera pokazuje aktualny status, czas ostatniego sygnału, listę reguł i prosty quick start bez ukrywania, skąd bierze się projekt/opis.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `convex/tracker.ts`, `src/components/TrackerPanels.tsx`, `src/lib/tracker.ts`, `tests/app.test.tsx`
LOC: ~650, ~763, ~1019, ~328
Dlaczego zmiana trafia tutaj: to istniejące seam-y helpera, bootstrapu, controllera i panelu.
Czy plik ma wiele odpowiedzialności: tak.
Minimalny fix: dokładono tylko listę/usuwanie reguł, czytelniejszy status helpera i quick start.
Czy potrzebne wydzielenie odpowiedzialności: tak, ale jako osobny task strukturalny.
Ryzyko: kolejne feature slice’y w tych plikach będą coraz mniej wygodne guardowo.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `convex/tracker.ts`, `src/components/TrackerPanels.tsx`, `src/lib/tracker.ts`
LOC: ~650, ~763, ~1019
Obecne odpowiedzialności: backend trackera/helpera, panel helpera i kontroler workspace.
Czy task dokłada nową odpowiedzialność: tak, ale tylko helper UX v2.
Minimalny fix bez rozbicia: tak, bo task miał zmieścić się w `FEATURE` 250 LOC diff-size.
Małe wydzielenie odpowiedzialności: odłożone poza zakres.
Ryzyko minimalnego fixu: dalszy wzrost kosztu utrzymania tych plików.
Ryzyko wydzielenia: większy diff i wyjście poza ten slice.
Rekomendacja: kolejny task strukturalny powinien wyciągnąć helper panel/controller i część logiki z `convex/tracker.ts`.

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
- `npm run clean`
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
Co zmieniono: dodano listę reguł helpera w UI, usuwanie reguły, prostą edycję przez prefill projektu/app/domain, czytelniejszy status ostatniego sygnału helpera oraz quick start sesji z helpera.
Jak sprawdzono: `npm run typecheck`, `npm test`, `npm run build`, `npm run clean`, `npm run gate:local`.
PASS / FAIL: PASS
Ryzyka: zachowanie jest prostsze i bardziej używalne, ale duże pliki nadal proszą się o osobny `STRUCTURE_FIX`; brak jeszcze pełnego historii zdarzeń helpera.
Follow-up: następny sensowny krok to albo prosty log ostatnich aktywności helpera, albo osobny task na rozbicie god files.
