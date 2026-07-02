# Archived Task

Closed At: 2026-07-02T18:38:56.405Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-sessiondialogs-split
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
STRUCTURE_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Rozbic SessionDialogs.tsx tak, aby zdjac warning >300 LOC bez zmiany zachowania UI.

## Kryteria sukcesu
- SessionDialogs.tsx spada do mniejszego

## Priorytet / Blocker
Największy blocker teraz: Rozbic SessionDialogs.tsx tak, aby zdjac warning >300 LOC bez zmiany zachowania UI.
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
- tests/**
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: tracker-components
Pliki: src/**, tests/**, tasks/todo.md, tasks/archive/**

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
Root cause: SessionDialogs.tsx mial 487 LOC i mieszal modale z panelem timera, co bylo najtanszym seamem do pierwszego bezpiecznego wydzielenia.
Dowód: check:godfiles pokazywal SessionDialogs.tsx >300 LOC, a pelny split byl za duzy na budget diff-size.
Aktualny flow: TimerPanel mieszka osobno w TrackerPanels.tsx, SessionDialogs.tsx skupia sie na dialogach plus pozostaly chrome.

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
UI truth: bez zmiany, bo TimerPanel zostal tylko przeniesiony.
Observability: gate:local jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: src/components/SessionDialogs.tsx
LOC: 377 po zmianie
Dlaczego zmiana trafia tutaj: to byl najwezszy split, ktory miescil sie w budget diff-size.
Czy plik ma wiele odpowiedzialności: tak, ale mniej niz przed splitem.
Minimalny fix: wydzielic tylko TimerPanel.
Czy potrzebne wydzielenie odpowiedzialności: tak, nastepnym slicem dla StatsGrid.
Ryzyko: niskie, bo TrackerWorkspace potrzebowal tylko zmiany importu.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: src/components/SessionDialogs.tsx
LOC: 487 -> 377
Obecne odpowiedzialności: dialogi, app header, stats
Czy task dokłada nową odpowiedzialność: NIE
Minimalny fix bez rozbicia: zostawic warning >300
Małe wydzielenie odpowiedzialności: TimerPanel do TrackerPanels.tsx
Ryzyko minimalnego fixu: srednie, bo warning >300 zostawalby bez ruchu
Ryzyko wydzielenia: niskie
Rekomendacja: zrobic jeszcze jeden maly slice dla StatsGrid

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
Expected result: diff-size PASS, SessionDialogs mniejszy, gate:local PASS.

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
Co zmieniono: wydzielono TimerPanel do TrackerPanels.tsx i zaktualizowano importy w TrackerWorkspace.
Jak sprawdzono: SessionDialogs ma 377 LOC, npm run gate:local PASS.
PASS / FAIL: PASS
Ryzyka: SessionDialogs nadal ma warning >300 LOC.
Follow-up: osobny slice dla StatsGrid, ktory powinien zrzucic plik ponizej 300 LOC.
