# Archived Task

Closed At: 2026-07-02T22:48:21.122Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-helper-privacy-control
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Dodac privacy i control UX dla desktop helpera: wlaczanie trackingu, pauza helpera i blacklist domen prywatnych.

## Kryteria sukcesu
- Uzytkownik moze wylaczyc helper tracking

## Priorytet / Blocker
Największy blocker teraz: Dodac privacy i control UX dla desktop helpera: wlaczanie trackingu, pauza helpera i blacklist domen prywatnych.
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
- convex/http.ts
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
Pliki: tasks/todo.md, convex/schema.ts, convex/tracker.ts, convex/http.ts, src/lib/trackerTypes.ts, src/lib/tracker.ts, src/components/TrackerPanels.tsx, src/components/TrackerWorkspace.tsx, src/App.tsx, tests/app.test.tsx

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
Root cause: helper desktopowy miał już ingest i sugestie projektów, ale brakowało productowego kontraktu prywatności i kontroli: użytkownik nie mógł wyłączyć trackingu helpera, spauzować go ani wykluczyć prywatnych domen.
Dowód: `trackerPreferences` nie miało pól helper privacy/control, a `ingestDesktopActivity` zawsze zapisywał ostatnią aktywność bez respektowania blacklisty lub stanu pauzy.
Aktualny flow: preferencje helpera przechowują enable/pause/blacklist, ingest zapisuje tylko bezpieczny stan zgodny z tymi preferencjami, a panel helpera pokazuje i steruje tym jawnie z UI.

## Granice
Moduły dotknięte: tracker
Kontrakty dotknięte: `trackerPreferences`, `savePreferences`, `ingestDesktopActivity`, panel helpera w React i pochodne typy preferencji.
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
State machine: `enabled -> paused timed/manual -> resumed`, oraz `enabled + private domain -> zapis tylko bezpiecznego statusu bez domeny/tytulu`.
Error classification: zapis preferencji fail-closed przez istniejący `savePreferences`; helper z błędnym kluczem nadal kończy się `ConvexError`.
Idempotency: kolejne sample helpera nadal nadpisują ostatni stan; zapis prywatnych domen normalizuje i deduplikuje wpisy.
Single-flight: UI blokuje równoległe akcje helper privacy przez `busyAction === desktop-helper-privacy`.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: panel helpera pokazuje, czy tracking jest aktywny, spauzowany albo wyłączony, oraz pozwala zapisać prywatne domeny i pause bez ukrytych side effectów.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `convex/tracker.ts`, `src/components/TrackerPanels.tsx`, `src/lib/tracker.ts`
LOC: ~625, ~684, ~961
Dlaczego zmiana trafia tutaj: privacy/control UX helpera siedzi na istniejącym seamie preferencji, ingestu i panelu helpera.
Czy plik ma wiele odpowiedzialności: tak.
Minimalny fix: dodano tylko pola preferencji helpera, filtrowanie ingestu i kontrolki UI bez refaktoru pobocznego.
Czy potrzebne wydzielenie odpowiedzialności: tak, ale jako osobny task.
Ryzyko: dalszy feature work w tych plikach będzie coraz droższy guardowo.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `convex/tracker.ts`, `src/components/TrackerPanels.tsx`, `src/lib/tracker.ts`
LOC: ~625, ~684, ~961
Obecne odpowiedzialności: backend trackera, helper ingest/rules, panel helpera/dashboard/timera oraz controller workspace.
Czy task dokłada nową odpowiedzialność: tak, ale wyłącznie helper privacy/control.
Minimalny fix bez rozbicia: tak, bo task musiał zmieścić się w `FEATURE` 250 LOC diff-size.
Małe wydzielenie odpowiedzialności: odłożone poza zakres.
Ryzyko minimalnego fixu: rosnący koszt utrzymania i kolejnych małych slice’ów.
Ryzyko wydzielenia: większy diff i wyjście poza scope bieżącego taska.
Rekomendacja: kolejny sensowny task strukturalny powinien wydzielić helper preferences/ingest z `convex/tracker.ts` i helper panel/controller z klienta.

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
Co zmieniono: dodano pola privacy/control helpera do preferencji, ingest respektujący enable/pause/private domains oraz panel helpera z toggle, pauzą 15/60/manual i zapisem blacklisty domen.
Jak sprawdzono: `npm run typecheck`, `npm test`, `npm run build`, `npm run clean`, `npm run gate:local`.
PASS / FAIL: PASS
Ryzyka: helper privacy/control jest już funkcjonalny, ale brak jeszcze listy/usuwania pojedynczych reguł projektu oraz duże pliki nadal wymagają osobnego `STRUCTURE_FIX`.
Follow-up: osobny task na zarządzanie regułami projektu albo osobny task na rozbicie god files, ale nie oba naraz.
