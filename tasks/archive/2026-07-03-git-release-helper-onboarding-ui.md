# Archived Task

Closed At: 2026-07-03T07:54:40.919Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-git-release-helper-onboarding-ui
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Zacommitowac aktualne zmiany helper onboarding UI, wypchnac je na origin i zmergowac do local `master`, a potem wypchnac `master`.

## Kryteria sukcesu
- Jest commit z aktualnymi zmianami helper UI.
- Branch `codex/convex-auth-workflow-import` jest wypchniety na origin.
- Local `master` zawiera ten commit i jest wypchniety na origin/master.

## Priorytet / Blocker
Największy blocker teraz: Zrealizować task: git-release-helper-onboarding-ui.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: git release
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- tasks/archive/**
- src/components/TrackerPanels.tsx
- src/components/TrackerWorkspace.tsx
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: backend, deploy config i pliki poza zakresem

## Zakres
Moduł: git release
Pliki: tasks/todo.md, src/components/TrackerPanels.tsx, src/components/TrackerWorkspace.tsx, tasks/archive/**

## Reprodukcja / dowód problemu
- `git status` pokazuje gotowe, niezatwierdzone zmiany w `TrackerPanels.tsx`, `TrackerWorkspace.tsx` i archiwach taskow.
- Uzytkownik poprosil: `zrob tez komit push merge`.

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
Root cause: zmiany sa juz wdrozone i przetestowane, ale repo nie ma jeszcze commita spinajacego ten stan.
Dowód: `git diff --stat` pokazuje dwa zmienione pliki UI i trzy niezatwierdzone archiwa taskow.
Aktualny flow: stage -> commit -> push branch -> fast-forward merge do `master` -> push `master`.

## Granice
Moduły dotknięte: git history dla helper onboarding UI
Kontrakty dotknięte: tylko stan branchy i commit historii
Poza zakresem: nowe zmiany kodu poza allowlista

## Kontrakt
INPUT: gotowe lokalne zmiany helper onboarding UI.
SUCCESS: commit istnieje lokalnie i na origin, a `master` jest z nim zsynchronizowany.
ERRORS: fail gate, fail commit, fail push albo konflikt merge.
STATUSES: PASS / FAIL.
SIDE EFFECTS: nowy commit i aktualizacja branchy na origin.
LOGS: komendy weryfikacyjne.
TESTS: `npm run gate:local`, `git status`, `git log`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwac i pokazac ostatni bezpieczny stan.
Null/missing data: nie zgadywac target brancha ani statusu remote.
Invalid schema: nie dotyczy.
Duplicate request: nie robic pustego drugiego commita.
Concurrent request: nie dotyczy.
Partial write: nie zostawiac brancha po polowie merge path bez raportu.
Worker crash: nie dotyczy.
Retry loop: nie dotyczy.
Provider unavailable: pokazac konkretny blad git albo sieci.

## Guard Scope
REQUIRED GUARDS:
- trzymac sie allowlisty.
- nie zmieniac tresci backendu ani deploy configu.
- uruchomic `npm run gate:local` przed commitem.
- merge do `master` tylko fast-forward, jesli historia jest liniowa.

NICE_TO_HAVE GUARDS:
- pomysły poza zakresem zapisać do ParkingLot.md.

OVERBUILD GUARDS:
- nie tworzyć nowego subsystemu bez osobnego taska.

ParkingLot.md updated:
NOT_NEEDED

## Runtime guards
State machine: active task -> gate -> stage -> commit -> push branch -> merge master -> push master.
Error classification: gate fail, git push fail, merge fail.
Idempotency: merge ma byc fast-forward bez dodatkowego merge commita.
Single-flight: nie dotyczy.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: commit ma obejmowac tylko gotowy stan juz zweryfikowany lokalnie i produkcyjnie.
Observability: `git status`, `git log`, `git rev-parse`, `gate:local`.

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
- [ ] Poprawic scope taska do realnie zmienionych plikow.
- [ ] Uruchomic `npm run gate:local`.
- [ ] Zrobic stage, commit i push brancha.
- [ ] Zmergowac fast-forward do `master` i wypchnac `master`.

## Weryfikacja
Komendy:
- `npm run gate:local`
- `git status --short`
- `git log --oneline --decorate --max-count=3`
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
Co zmieniono: przygotowano release task dla commita i merge, utrzymano scope dla `TrackerPanels.tsx`, `TrackerWorkspace.tsx` i archiwow taskow.
Jak sprawdzono: `npm run gate:local`
PASS / FAIL: PASS
Ryzyka: `TrackerPanels.tsx` pozostaje god file i gate tylko to raportuje, nie blokuje.
Follow-up: stage, commit, push branch, fast-forward merge do `master`, push `master`.
