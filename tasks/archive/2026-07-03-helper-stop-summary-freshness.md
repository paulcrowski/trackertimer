# Archived Task

Closed At: 2026-07-03T14:24:47.145Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-helper-stop-summary-freshness
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Helper summary przy STOP ma pokazywać tylko potwierdzony czas z helpera, bez zgadywania po utracie sygnału.

## Kryteria sukcesu
- Helper summary nie wydłuża ostatniego kontekstu poza ostatni potwierdzony sygnał helpera
- UI mówi wprost, gdy podgląd helpera jest niepełny

## Priorytet / Blocker
Największy blocker teraz: Helper summary przy STOP ma pokazywać tylko potwierdzony czas z helpera, bez zgadywania po utracie sygnału.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: helper-stop-summary-freshness
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/lib/tracker.ts
- src/components/SessionDialogs.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: helper-stop-summary-freshness
Pliki: tasks/todo.md, src/lib/tracker.ts, src/components/SessionDialogs.tsx, tests/app.test.tsx

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
Root cause: `buildStopFocusSummary()` liczył ostatni blok helpera aż do `sessionEnd`, nawet gdy ostatni realny sygnał helpera był dużo wcześniej. To zamieniało brak danych z helpera w pozornie precyzyjny czas kontekstu.
Dowód: w `src/lib/tracker.ts` ostatni blok używał `sessionEnd` jako końca bez żadnego guardu świeżości; helper status miał już istniejący próg `desktopHelperConnectedThresholdMs = 20_000`, ale summary go ignorowało. Przy aktywnej sesji `100_000 -> 300_000` i ostatnim sygnale helpera `120_000` summary mogło udawać 200 s pokrycia zamiast 20 s potwierdzonego czasu.
Aktualny flow: helper activities + opcjonalny `lastSeenAt` budują sample tylko w oknie sesji; jeśli końcówka sesji jest poza progiem świeżości od ostatniego sample, summary ucina się do ostatniego potwierdzonego sygnału i oznacza wynik jako częściowy.

## Granice
Moduły dotknięte: helper-stop-summary-freshness
Kontrakty dotknięte: `buildStopFocusSummary` w `src/lib/tracker.ts`, kontrakt copy `StopDialog`, testy regresyjne helper summary.
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: aktywna sesja, helper activities i helper status z `lastSeenAt`.
SUCCESS: helper summary kończy ostatni blok tylko na potwierdzonym sygnale helpera; jeśli pokrycie nie obejmuje końcówki sesji, UI pokazuje jawny komunikat o niepełnym podglądzie.
ERRORS: summary nie może dalej udawać pełnej końcówki sesji po utracie sygnału helpera ani mieszać sample spoza czasu sesji.
STATUSES: pełne pokrycie helpera albo częściowy podgląd helpera.
SIDE EFFECTS: brak zmian w persistence; tylko truthfulness helper summary przy STOP.
LOGS: `npm test`, `npm run typecheck`, `npm run gate:local`.
TESTS: test copy dla częściowego preview i regresja na stale helper signal.
DONE: review ma konkretny wynik PASS i archive zachowuje dowód.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak helper sample nadal daje `null`, a nie zgadywany timeline.
Invalid schema: nie dotyczy poza istniejącym shape helper activities/status.
Duplicate request: nie dotyczy, summary jest czysto pochodne.
Concurrent request: task nie zmienia współbieżności; usuwa tylko fałszywe dociąganie końcówki.
Partial write: częściowe pokrycie helpera jest teraz jawnie oznaczone `isPartial`, a nie ukryte jako pełny sukces.
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
State machine: `session + helper samples -> build summary`; jeśli ostatni sygnał helpera jest świeży, summary może domknąć blok do końca sesji; jeśli nie, summary kończy się na ostatnim potwierdzonym sygnale i ustawia `isPartial`.
Error classification: brak sample = `no_summary`; stare sample = `partial_summary`, nie pełny success.
Idempotency: czysto pochodny helper summary, bez side-effectów.
Single-flight: nie dotyczy, brak fetch/job orchestration.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: `StopDialog` musi odróżniać pełny podgląd helpera od częściowego, żeby user nie traktował końcówki bez sygnału jako faktu.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/lib/tracker.ts`, `src/components/SessionDialogs.tsx`, `tests/app.test.tsx`
LOC: ~1729, ~434, ~1080
Dlaczego zmiana trafia tutaj: helper summary seam i kontrakt dialogu STOP istnieją już tylko w tych plikach.
Czy plik ma wiele odpowiedzialności: tak, szczególnie `src/lib/tracker.ts` i test bundle.
Minimalny fix: dodać freshness guard i jawny partial notice bez wydzielania nowego modułu.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: dokładanie kolejnego małego diffu do dużych plików, ale scope pozostaje jeden kontrakt.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `src/lib/tracker.ts`, `tests/app.test.tsx`
LOC: ~1729, ~1080
Obecne odpowiedzialności: helpery trackera, source-of-truth aktywnej sesji, controller, testy kontraktowe i UI proofy.
Czy task dokłada nową odpowiedzialność: nie, tylko doprecyzowuje istniejący kontrakt helper summary.
Minimalny fix bez rozbicia: freshness guard i `isPartial` w istniejącym summary type.
Małe wydzielenie odpowiedzialności: odłożone, bo byłby to osobny `STRUCTURE_FIX`.
Ryzyko minimalnego fixu: niskie.
Ryzyko wydzielenia: wyjście poza scope.
Rekomendacja: minimalny fix teraz, bez przebudowy modułów.

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
Co zmieniono: `buildStopFocusSummary()` ucina teraz helper summary do ostatniego potwierdzonego sygnału i oznacza niepełne pokrycie flagą `isPartial`; `StopDialog` komunikuje wtedy, że końcówka sesji bez sygnału nie jest zgadywana; dodano test copy i regresję na stary sygnał helpera.
Jak sprawdzono: `npm test` PASS, `npm run typecheck` PASS, `npm run gate:local` PASS.
PASS / FAIL: PASS
Ryzyka: summary nadal jest advisory preview, nie audytowalnym logiem aktywności; jeśli kiedyś potrzebna będzie dokładna analityka coverage helpera, to osobny task na jawny model pokrycia albo bloków.
Follow-up: ewentualny osobny task tylko jeśli chcesz pokazywać procent pokrycia helpera albo brakujące minuty sesji jako osobną metrykę.
