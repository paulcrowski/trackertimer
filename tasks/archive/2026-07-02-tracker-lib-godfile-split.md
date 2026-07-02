# Archived Task

Closed At: 2026-07-02T17:34:10.670Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-tracker-lib-godfile-split
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
STRUCTURE_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Zmniejszyc src/lib/tracker.ts ponizej progu >500 LOC bez zmiany zachowania runtime.

## Kryteria sukcesu
- src/lib/tracker.ts nie ma juz warningu >500 LOC

## Priorytet / Blocker
Największy blocker teraz: Zmniejszyc src/lib/tracker.ts ponizej progu >500 LOC bez zmiany zachowania runtime.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: tracker-lib
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
Moduł: tracker-lib
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
Root cause: src/lib/tracker.ts mial 547 LOC i mieszal kontrakty typow, stale, helpery oraz kontroler workspace, co dawalo warning >500 LOC.
Dowód: check:godfiles przed zmiana raportowal src/lib/tracker.ts >500 LOC.
Aktualny flow: trackerTypes.ts trzyma typy i stale, a tracker.ts zostaje publicznym seamem helperow i kontrolera przez re-exporty.

## Granice
Moduły dotknięte: tracker-lib
Kontrakty dotknięte: publiczny seam src/lib/tracker.ts pozostaje stabilny; brak zmiany kontraktu runtime.
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
UI truth: bez zmiany, bo konsumenci dalej importuja z tracker.ts.
Observability: check:godfiles i gate:local jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: src/lib/tracker.ts
LOC: 473 po zmianie
Dlaczego zmiana trafia tutaj: to byl najwiekszy aktywny warning >500 LOC po baselinie.
Czy plik ma wiele odpowiedzialności: tak, ale mniej niz przed splitem.
Minimalny fix: wyciagnac tylko typy, stale i handlers do osobnego modulu.
Czy potrzebne wydzielenie odpowiedzialności: tak, ale kolejnymi malymi taskami.
Ryzyko: niskie, bo seam publiczny zostal zachowany przez re-exporty.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: src/lib/tracker.ts
LOC: 547 -> 473
Obecne odpowiedzialności: helpery UI + kontroler workspace
Czy task dokłada nową odpowiedzialność: NIE
Minimalny fix bez rozbicia: zostawic warning >500
Małe wydzielenie odpowiedzialności: trackerTypes.ts
Ryzyko minimalnego fixu: srednie, bo warning >500 zostaje
Ryzyko wydzielenia: niskie
Rekomendacja: zostawic tracker.ts jako seam re-exportow i controllera, kolejne splity robic osobno

## Dependency Direction Guard
Czy zmiana odwraca zależność?
NIE

Czy Business Logic importuje UI/DB/framework?
NIE

Czy adapter przecieka do core?
NIE

## Change Isolation
Ile modułów dotyka zmiana: tracker.ts plus nowy trackerTypes.ts.
Czy to naturalne: tak.
Czy da się ograniczyć zmianę do jednego kontraktu: tak, do warstwy tracker-lib.

## Plan
- [x] Przeczytać pliki z allowlisty.
- [x] Wykonać najmniejszą bezpieczną zmianę.
- [x] Uruchomić weryfikację.

## Weryfikacja
Komendy:
wc -l src/lib/tracker.ts src/lib/trackerTypes.ts
npm run typecheck
npm run gate:local
Expected result: tracker.ts <500 LOC, typecheck PASS, gate:local PASS.

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
Co zmieniono: wyciagnieto categories, typy i defaultPreferences do src/lib/trackerTypes.ts, a tracker.ts zostal odchudzony i utrzymal publiczny seam przez re-exporty.
Jak sprawdzono: tracker.ts ma 473 LOC, npm run typecheck PASS, npm run gate:local PASS.
PASS / FAIL: PASS
Ryzyka: SessionDialogs.tsx nadal ma warning >300 LOC i jest nastepnym naturalnym slicem.
Follow-up: zrobic osobny STRUCTURE_FIX dla SessionDialogs.tsx.
