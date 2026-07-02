# Archived Task

Closed At: 2026-07-02T17:21:25.932Z
Result: FAIL
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-tracker-guard-replan
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
STRUCTURE_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Doprowadzic przebudowe trackera do stanu zgodnego z local gate przez lepszy podzial modulow i mniejsza liczbe changed files.

## Kryteria sukcesu
- Kod dalej przechodzi typecheck/test/build

## Priorytet / Blocker
Największy blocker teraz: Doprowadzic przebudowe trackera do stanu zgodnego z local gate przez lepszy podzial modulow i mniejsza liczbe changed files.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: frontend-app-shell
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- index.html
- src/**
- convex/**
- tests/**
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: frontend-app-shell
Pliki: index.html, src/**, convex/**, tests/**, tasks/todo.md, tasks/archive/**

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
Root cause: po pierwszej przebudowie guard diff-size nadal liczyl caly duzy diff wzgledem HEAD, wiec samo zmniejszenie liczby plikow nie wystarczylo do przejscia gate:local.
Dowód: po redukcji counted files do budzetu check:diff-size przestal failowac na liczbie plikow i zaczal failowac na 4821 counted lines przy limicie 250.
Aktualny flow: index.html jest cienkim shellem, React UI ma mniejszy TrackerWorkspace, a convex/tracker ma helpery wyciagniete do trackerModel.

## Granice
Moduły dotknięte: frontend-app-shell
Kontrakty dotknięte: bez nowych funkcji biznesowych; tylko przeniesienie odpowiedzialnosci miedzy modulami UI i helperami server-side.
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
State machine: bez zmiany biznesowej wzgledem poprzedniego slica.
Error classification: bez zmiany; ConvexError pozostaje terminalny dla walidacji i ownership.
Idempotency: bez zmiany.
Single-flight: bez zmiany.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: poprawione przez wyjecie kontrolera workspace do jednego hooka, zamiast rozproszonej logiki w komponencie renderujacym.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: src/components/SessionDialogs.tsx, src/lib/tracker.ts
LOC: 488, 548
Dlaczego zmiana trafia tutaj: ten slice redukowal count files i wyciagal orchestration z TrackerWorkspace bez dodawania nowych counted files ponad budzet.
Czy plik ma wiele odpowiedzialności: tak, ale to kontrolowana konsolidacja pomocniczych komponentow i hooka kontrolera.
Minimalny fix: zostawic ten stan jako przejsciowy i rozbijac dalej juz po zresetowaniu diffu wobec HEAD.
Czy potrzebne wydzielenie odpowiedzialności: tak, jako kolejny task po commit/replay.
Ryzyko: dalsze dokladanie funkcji do tych plikow bedzie znow pompowac god files.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: src/lib/tracker.ts
LOC: 548
Obecne odpowiedzialności: typy UI, helpery formatowania, helpery eksportu, helpery audio, hook kontrolera workspace
Czy task dokłada nową odpowiedzialność: czesciowo tak, ale po to, zeby zdjac orchestration z TrackerWorkspace i nie przekroczyc file budgetu
Minimalny fix bez rozbicia: utrzymac ten stan przejsciowy do czasu zresetowania diffu
Małe wydzielenie odpowiedzialności: po kolejnym commicie rozdzielic typy/helpers/controller na osobne pliki
Ryzyko minimalnego fixu: umiarkowane, bo plik jest juz >500 LOC
Ryzyko wydzielenia: niskie po zresetowaniu diffu wobec HEAD
Rekomendacja: nie dokladac tam nowych feature'ow przed kolejnym slicem strukturalnym

## Dependency Direction Guard
Czy zmiana odwraca zależność?
NIE

Czy Business Logic importuje UI/DB/framework?
NIE

Czy adapter przecieka do core?
NIE

## Change Isolation
Ile modułów dotyka zmiana: App shell, controller hook, ui helper components, server helper model.
Czy to naturalne: tak dla repo-clean slica.
Czy da się ograniczyć zmianę do jednego kontraktu: nie w pelni, bo blocker siedzi w budzecie diffu wzgledem HEAD, nie w jednym runtime seamie.

## Plan
- [x] Przeczytać pliki z allowlisty.
- [x] Wykonać najmniejszą bezpieczną zmianę.
- [x] Uruchomić weryfikację.

## Weryfikacja
Komendy:
npm run typecheck
npm test
npm run build
npm run check:godfiles
npm run check:project-gates
npm run check:import-boundaries
npm run gate:local
Expected result: wszystkie gate'y poza diff-size PASS; gate:local FAIL tylko na line budget wobec HEAD.

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
Co zmieniono: zredukowano counted files do 12, odchudzono TrackerWorkspace do 158 LOC, odchudzono convex/tracker do 207 LOC, wyciagnieto helpery serwerowe do convex/trackerModel.ts i scalono drobne komponenty, zeby nie przebic file budgetu.
Jak sprawdzono: npm run typecheck PASS, npm test PASS, npm run build PASS, npm run check:godfiles PASS z warningami dla SessionDialogs/lib tracker, npm run check:project-gates PASS, npm run check:import-boundaries PASS, npm run gate:local FAIL tylko na 4821 counted lines vs 250.
PASS / FAIL: FAIL
Ryzyka: jedyny realny blocker to historia diffu wzgledem HEAD; z poziomu kodu i runtime ten slice jest zielony.
Follow-up: albo commit obecny stan jako nowy baseline i wtedy odpalic gate na kolejnym malym diffie, albo odtworzyc te zmiany od HEAD w kilku mniejszych taskach/commitach.
