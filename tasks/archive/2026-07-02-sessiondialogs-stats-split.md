# Archived Task

Closed At: 2026-07-02T18:41:13.992Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-sessiondialogs-stats-split
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
STRUCTURE_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Wydzielic StatsGrid z SessionDialogs.tsx, aby zbic plik ponizej 300 LOC.

## Kryteria sukcesu
- SessionDialogs.tsx spada ponizej 300 LOC

## Priorytet / Blocker
Największy blocker teraz: Wydzielic StatsGrid z SessionDialogs.tsx, aby zbic plik ponizej 300 LOC.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: tracker-components
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- src/**
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: tracker-components
Pliki: src/**, tasks/todo.md, tasks/archive/**

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
Root cause: po wydzieleniu TimerPanel SessionDialogs.tsx nadal mial 376 LOC, a najtanszym kolejnym seamem byl StatsGrid.
Dowód: check:godfiles po poprzednim slicie nadal raportowal SessionDialogs.tsx >300 LOC.
Aktualny flow: AppHeader i dialogi zostaly w SessionDialogs.tsx, a TrackerPanels.tsx trzyma juz TimerPanel i StatsGrid.

## Granice
Moduły dotknięte: tracker-components
Kontrakty dotknięte: brak zmiany kontraktu runtime; tylko import seam TrackerWorkspace.
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
State machine: bez zmiany.
Error classification: bez zmiany.
Idempotency: nie dotyczy.
Single-flight: bez zmiany.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: bez zmiany, bo StatsGrid zostal tylko przeniesiony.
Observability: gate:local jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: src/components/SessionDialogs.tsx
LOC: 294 po zmianie
Dlaczego zmiana trafia tutaj: to byl ostatni warning >300 LOC po pierwszym slicie.
Czy plik ma wiele odpowiedzialności: umiarkowanie, ale juz bez stats i timera.
Minimalny fix: wydzielic tylko StatsGrid.
Czy potrzebne wydzielenie odpowiedzialności: nie pilnie; warning zostal zdjety.
Ryzyko: niskie, bo importy w TrackerWorkspace byly jedynym miejscem do aktualizacji.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: src/components/SessionDialogs.tsx
LOC: 376 -> 294
Obecne odpowiedzialności: dialogi + app header
Czy task dokłada nową odpowiedzialność: NIE
Minimalny fix bez rozbicia: zostawic warning >300
Małe wydzielenie odpowiedzialności: StatsGrid do TrackerPanels.tsx
Ryzyko minimalnego fixu: srednie, bo warning strukturalny zostawalby na miejscu
Ryzyko wydzielenia: niskie
Rekomendacja: zatrzymac dalszy split tutaj, dopoki nowy task nie bedzie mial realnego uzasadnienia

## Dependency Direction Guard
Czy zmiana odwraca zależność?
NIE

Czy Business Logic importuje UI/DB/framework?
NIE

Czy adapter przecieka do core?
NIE

## Change Isolation
Ile modułów dotyka zmiana: SessionDialogs, TrackerPanels, TrackerWorkspace.
Czy to naturalne: tak.
Czy da się ograniczyć zmianę do jednego kontraktu: tak, do warstwy komponentow trackera.

## Plan
- [x] Przeczytać pliki z allowlisty.
- [x] Wykonać najmniejszą bezpieczną zmianę.
- [x] Uruchomić weryfikację.

## Weryfikacja
Komendy:
wc -l src/components/SessionDialogs.tsx src/components/TrackerPanels.tsx
npm run gate:local
Expected result: SessionDialogs <300 LOC i gate:local PASS.

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
Co zmieniono: wydzielono StatsGrid do TrackerPanels.tsx i zaktualizowano importy w TrackerWorkspace.
Jak sprawdzono: SessionDialogs ma 294 LOC, npm run gate:local PASS.
PASS / FAIL: PASS
Ryzyka: brak aktywnego warningu god-file w warstwie komponentow trackera dla tego seamu.
Follow-up: kolejny slice tylko jesli pojawi sie nowy sensowny seam, nie dla samego rozbijania.
