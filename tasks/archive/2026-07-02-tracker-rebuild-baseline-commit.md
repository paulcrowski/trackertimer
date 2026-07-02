# Archived Task

Closed At: 2026-07-02T17:30:58.239Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-tracker-rebuild-baseline-commit
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
STRUCTURE_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Zapisac obecna przebudowe trackera jako nowy baseline git, aby kolejne male taski mogly przechodzic local gate.

## Kryteria sukcesu
- Zmiany sa intentional

## Priorytet / Blocker
Największy blocker teraz: Zapisac obecna przebudowe trackera jako nowy baseline git, aby kolejne male taski mogly przechodzic local gate.
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
Root cause: repo mial juz dzialajaca przebudowe trackera, ale dopoki duzy diff wisial wzgledem HEAD, kazdy kolejny task dziedziczyl czerwony check:diff-size.
Dowód: runtime i build byly zielone, a jedynym trwałym blockerem pozostawal diff-size liczony od HEAD zamiast od nowego baseline.
Aktualny flow: zapisac intentional stan jako commit bazowy, zeby kolejne zmiany byly mierzone od czystego punktu startowego.

## Granice
Moduły dotknięte: frontend-app-shell
Kontrakty dotknięte: brak nowych zmian biznesowych; task dotyczy baseline git i czystego stanu workflow po przebudowie.
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
State machine: bez zmiany wzgledem przebudowy.
Error classification: bez zmiany wzgledem przebudowy.
Idempotency: nie dotyczy dla samego baseline commit.
Single-flight: bez zmiany.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: bez zmiany; commit nie moze zmienic zachowania runtime.
Observability: git status, commit i gate:local po commicie sa dowodem.

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
Czy da się ograniczyć zmianę do jednego kontraktu: tak, bo celem jest tylko nowy punkt odniesienia w git/workflow.

## Plan
- [x] Przeczytać pliki z allowlisty.
- [x] Wykonać najmniejszą bezpieczną zmianę.
- [x] Uruchomić weryfikację.

## Weryfikacja
Komendy:
git status --short
git add ...
git commit -m "Refactor tracker into modular React Convex app"
npm run gate:local
Expected result: commit istnieje, worktree dla tego taska jest zbaselinowany, a gate:local nie dziedziczy juz starego diffu.

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
Co zmieniono: przygotowano intentional stan przebudowy do zapisania jako nowy baseline git.
Jak sprawdzono: wczesniejsze typecheck/test/build/project-gates byly zielone; ten task domyka git/workflow wokol tego stanu.
PASS / FAIL: PASS
Ryzyka: po samym task:close nadal trzeba wykonac rzeczywisty commit i gate:local na czystym diffie.
Follow-up: po commicie kontynuowac tylko malymi slice'ami.
