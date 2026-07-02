# Archived Task

Closed At: 2026-07-02T22:38:10.587Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-rules-auto-attribution
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Dodac reguly przypisywania projektu na podstawie aktywnej appki/domeny z desktop helpera oraz auto-attribution dla startu sesji i sugestii w UI.

## Kryteria sukcesu
- Uzytkownik moze zapisac regule app/domain -> projekt

## Priorytet / Blocker
Największy blocker teraz: Dodac reguly przypisywania projektu na podstawie aktywnej appki/domeny z desktop helpera oraz auto-attribution dla startu sesji i sugestii w UI.
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
Pliki: tasks/todo.md, convex/schema.ts, convex/tracker.ts, src/lib/trackerTypes.ts, src/lib/tracker.ts, src/components/TrackerPanels.tsx, src/components/TrackerWorkspace.tsx, src/App.tsx, tests/app.test.tsx

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
Root cause: desktop helper zapisywał tylko ostatnią aktywność, ale nie istniał kontrakt reguł `app/domain -> projekt`, brakowało sugestii w `bootstrap` i start sesji brał wyłącznie ręczne `projectName`.
Dowód: `convex/schema.ts` nie miało tabeli reguł, `convex/tracker.ts` nie zwracał sugestii helpera, a `src/components/TrackerPanels.tsx` nie miało żadnego miejsca do zapisania mapowania.
Aktualny flow: helper dostarcza ostatnią aktywną appkę/domenę, użytkownik zapisuje z niej regułę dla projektu, `bootstrap` zwraca sugestię projektu, a `START` używa sugestii gdy pole projektu jest puste.

## Granice
Moduły dotknięte: tracker
Kontrakty dotknięte: schema Convex dla `trackingRules`, `bootstrap` trackera, mutacja zapisu reguły, UI panelu helpera i controller startu sesji.
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
State machine: brak helpera -> brak sugestii; helper aktywny bez reguły -> tylko status; helper aktywny z regułą -> sugestia; start z ręcznym projektem -> wygrywa ręczny projekt; start bez projektu -> użyj sugestii albo `null`.
Error classification: pusta nazwa projektu albo brak app/domain przy zapisie reguły zwraca jawny `ConvexError`.
Idempotency: zapis tej samej reguły aktualizuje istniejący wpis zamiast mnożyć duplikaty dla tej samej pary app/domain.
Single-flight: UI blokuje zapis reguły przez `busyAction === desktop-rule-save`.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: panel helpera pokazuje ostatnią aktywność oraz aktualną sugestię projektu; auto-przypisanie działa tylko gdy użytkownik nie poda projektu ręcznie.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `convex/tracker.ts`, `src/components/TrackerPanels.tsx`, `src/lib/tracker.ts`
LOC: ~544, ~614, ~924
Dlaczego zmiana trafia tutaj: to istniejące kontrakty danych, panel helpera i controller startu sesji; allowlista tego taska nie pozwalała na nowe pliki wydzielające.
Czy plik ma wiele odpowiedzialności: tak, szczególnie `src/lib/tracker.ts`.
Minimalny fix: dopięto tylko reguły helpera, sugestię i start sesji bez refaktoru pobocznego.
Czy potrzebne wydzielenie odpowiedzialności: tak, ale jako osobny task.
Ryzyko: dalsze dokładanie logiki do tych plików podnosi koszt kolejnych sliców.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `convex/tracker.ts`, `src/components/TrackerPanels.tsx`, `src/lib/tracker.ts`
LOC: ~544, ~614, ~924
Obecne odpowiedzialności: backend trackera, panele dashboard/timera/helpera, controller/workspace helpers.
Czy task dokłada nową odpowiedzialność: tak, ale ograniczoną do auto-attribution helpera.
Minimalny fix bez rozbicia: tak, bo task wymagał dotknięcia istniejących seamów i musiał zmieścić się w diff-size 250.
Małe wydzielenie odpowiedzialności: odłożone poza zakres tego taska.
Ryzyko minimalnego fixu: rośnie presja na już-duże pliki.
Ryzyko wydzielenia: większy diff i wyjście poza scope lock tego slice'a.
Rekomendacja: następny task po funkcjonalnym domknięciu powinien wydzielić helper/rules UI i controller logic z `src/lib/tracker.ts`.

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
Co zmieniono: dodano tabelę `trackingRules`, mutację zapisu reguły z helpera, sugestię projektu w `bootstrap`, prosty panel zapisu reguły z bieżącej aktywności helpera oraz auto-przypisanie projektu przy `START`, gdy pole projektu jest puste.
Jak sprawdzono: `npm run typecheck`, `npm test`, `npm run build`, `npm run clean`, `npm run gate:local`.
PASS / FAIL: PASS
Ryzyka: pliki `convex/tracker.ts`, `src/components/TrackerPanels.tsx` i szczególnie `src/lib/tracker.ts` pozostają za duże; kolejny slice powinien wydzielić helper/rules do mniejszych modułów.
Follow-up: osobny task na listę/edycję/usuwanie reguł i osobny task na rozbicie god files.
