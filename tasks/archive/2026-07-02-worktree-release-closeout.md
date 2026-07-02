# Archived Task

Closed At: 2026-07-02T20:06:53.559Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-worktree-release-closeout
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
STRUCTURE_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Uporzadkowac worktree trackertimer, dopisac aktualna dokumentacje, zamknac zmiany w intencjonalnych commitach, zmergowac aktualny branch integracyjny z origin/master i wypchnac wynik na origin.

## Kryteria sukcesu
- Worktree jest czysty

## Priorytet / Blocker
Największy blocker teraz: Uporzadkowac worktree trackertimer, dopisac aktualna dokumentacje, zamknac zmiany w intencjonalnych commitach, zmergowac aktualny branch integracyjny z origin/master i wypchnac wynik na origin.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: git+docs+release
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- README.md
- index.html
- src/main.tsx
- src/App.tsx
- src/index.css
- src/components/SessionDialogs.tsx
- src/components/TrackerPanels.tsx
- src/components/TrackerWorkspace.tsx
- src/lib/tracker.ts
- src/lib/pomodoro.ts
- src/lib/pwa.ts
- tests/app.test.tsx
- convex/auth.ts
- convex/_generated/api.d.ts
- public/**
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: git+docs+release
Pliki: tasks/todo.md, README.md, index.html, src/main.tsx, src/App.tsx, src/index.css, src/components/SessionDialogs.tsx, src/components/TrackerPanels.tsx, src/components/TrackerWorkspace.tsx, src/lib/tracker.ts, src/lib/pomodoro.ts, src/lib/pwa.ts, tests/app.test.tsx, convex/auth.ts, convex/_generated/api.d.ts, public/**, tasks/archive/**

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
Root cause: worktree zawieral dwa zakonczone, ale niezakomitowane strumienie zmian (Google auth oraz PWA/pomodoro), repo mialo nieaktualny README i branch byl rozjechany wzgledem `origin/master`.
Dowód: `git status --short --branch`, `git rev-list --left-right --count origin/master...HEAD`, stary README opisujacy AI Studio starter zamiast realnego produktu.
Aktualny flow: dwa intencjonalne commity produktowe -> merge `origin/master` -> weryfikacja `test/typecheck/build` -> push -> zamkniecie taska z czystym worktree.

## Granice
Moduły dotknięte: git+docs+release
Kontrakty dotknięte: do uzupełnienia, jeśli dotyczy.
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
State machine: dirty worktree -> split commits -> merged branch -> verified branch -> pushed branch -> archived task.
Error classification: release issue z Pages byl config error (`VITE_CONVEX_URL` missing in deploy build), poprawiony przed closeoutem; brak retry loopow i brak zmian backendowych w tym tasku.
Idempotency: commity sa rozdzielone produktowo, merge z `origin/master` jest jednokrotny i ma jawny commit merge.
Single-flight: nie dotyczy.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: README i task archive odpowiadaja faktycznemu stanowi produktu i deployu.
Observability: `git log`, `git status`, `npm test`, `npm run typecheck`, `npm run build`, `git merge`, `git push`.

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
Czy da się ograniczyć zmianę do jednego kontraktu: tak.

## Plan
- [ ] Przeczytać pliki z allowlisty.
- [ ] Wykonać najmniejszą bezpieczną zmianę.
- [ ] Uruchomić weryfikację.

## Weryfikacja
Komendy:
- `git status --short --branch`
- `git rev-list --left-right --count origin/master...HEAD`
- `npm test`
- `npm run typecheck`
- `npm run build`
- `git merge --no-edit origin/master`
- `git push origin codex/convex-auth-workflow-import`
Expected result: PASS.

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
Co zmieniono: rozdzielono zmiany na commity `feat: restore Google auth for worktimer` i `feat: add PWA pomodoro to worktimer`, zaktualizowano README do realnego produktu i deploymentu, zmergowano bieżący branch z `origin/master`.
Jak sprawdzono: `npm test` PASS, `npm run typecheck` PASS, `npm run build` PASS po merge; sprawdzono tez stan branchy i worktree komendami git.
PASS / FAIL: PASS
Ryzyka: `gate:local` dla wcześniejszego taska PWA nie spełniał limitu diff-size w jednym slicie, ale zmiany zostały potem zamknięte w osobnych commitach i zweryfikowane funkcjonalnie.
Follow-up: jeśli repo ma wrócić na klasyczny `master` jako branch domyślny, to osobny task powinien zmienić `origin/HEAD` i politykę merge na GitHub.
