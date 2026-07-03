# Archived Task

Closed At: 2026-07-03T08:48:18.945Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-helper-stop-focus-summary-v3
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Zrealizować task: helper-stop-focus-summary-v3.

## Kryteria sukcesu
- Task ma dowód PASS.

## Priorytet / Blocker
Największy blocker teraz: Zrealizować task: helper-stop-focus-summary-v3.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: helper focus summary v3
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- tasks/archive/**
- convex/tracker.ts
- src/lib/trackerTypes.ts
- src/lib/tracker.ts
- src/components/SessionDialogs.tsx
- src/components/TrackerWorkspace.tsx
- tests/app.test.tsx
- worktimer-helper.mjs
Kontrakty do przeczytania: AGENTS.md, docs/ARCHITECTURE_GUARDS.md oraz tylko potrzebne pliki dla taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: deploy, auth, start/stop mechanika sesji i helper capture poza potrzebnym kontraktem

## Zakres
Moduł: helper focus summary v3
Pliki: tasks/todo.md, convex/tracker.ts, src/lib/trackerTypes.ts, src/lib/tracker.ts, src/components/SessionDialogs.tsx, src/components/TrackerWorkspace.tsx, tests/app.test.tsx, worktimer-helper.mjs

## Reprodukcja / dowód problemu
- Helper na Macu juz wysyla aktywne appki i domeny do worktimera.
- UI pokazuje status i ostatnia aktywnosc helpera, ale nie daje odpowiedzi co realnie dzialo sie w trakcie sesji timera.
- User chce trzy rzeczy: prywatne konteksty, liczbe utrat koncentracji i podsumowanie przy STOP, na Macu i Windows.

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
Root cause: helper aktywnosci jest odseparowany od decyzji przy STOP sesji; zbiera próbki i sugestie projektu, ale nie skleja ich w czytelny timeline ani nie liczy focus loss.
Dowód: `bootstrap` zwraca `desktopHelperActivities` i `desktopProjectSuggestion`, a `StopDialog` pokazuje tylko note i dzwiek bez podsumowania helpera.
Aktualny flow: helper zbiera sample -> backend zapisuje ostatnia aktywnosc i ostatnie sample -> timer zapisuje sesje recznie bez analizy helpera.

## Granice
Moduły dotknięte: recent helper activity query limit, frontendowa klasyfikacja helper timeline, modal STOP
Kontrakty dotknięte: `TrackerBootstrap`, `TrackerPreferences`, `StopDialog` props i helper focus summary helpers
Poza zakresem: pelny automatyczny podzial jednej sesji na wiele zapisanych sesji, nowe tabele blokow, dodatkowy deploy

## Kontrakt
INPUT: aktywna sesja timera plus helper sample z Maca albo Windows.
SUCCESS: przy STOP user widzi podsumowanie helpera z blokami, prywatnymi kontekstami i liczba utrat koncentracji.
ERRORS: helper summary liczy prywatne rzeczy jawnie, nie pokazuje focus loss albo nie dziala przy aktywnej sesji.
STATUSES: PASS / FAIL.
SIDE EFFECTS: UI pokazuje nowe summary w stop dialog i helper query zwraca wiecej historii.
LOGS: komendy weryfikacyjne.
TESTS: test helper summary + `npm run gate:local`
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwac i pokazac ostatni bezpieczny stan.
Null/missing data: bez helper sample summary ma sie nie wysypac, tylko pokazac brak danych.
Invalid schema: nie dotyczy.
Duplicate request: nie liczyc wielokrotnie tego samego focus loss dla jednego bloku.
Concurrent request: nie dotyczy.
Partial write: nie zostawiac pustego sukcesu.
Worker crash: nie dotyczy.
Retry loop: nie dotyczy.
Provider unavailable: nie dotyczy, bo liczenie jest lokalne na danych juz zapisanych.

## Guard Scope
REQUIRED GUARDS:
- trzymac sie allowlisty.
- nie dodawac nowego subsystemu blokow w DB.
- prywatne konteksty maja byc maskowane, nie tylko zliczane.
- uruchomic `npm run gate:local`.

NICE_TO_HAVE GUARDS:
- pomysły poza zakresem zapisać do ParkingLot.md.

OVERBUILD GUARDS:
- nie tworzyć nowego subsystemu bez osobnego taska.

ParkingLot.md updated:
NOT_NEEDED

## Runtime guards
State machine: helper sample -> timeline block -> klasyfikacja (`work` / `private` / `distraction`) -> summary przy STOP.
Error classification: brak sample = `no_data`, prywatny kontekst = `masked_private`, wybicie z pracy = `focus_loss`.
Idempotency: ten sam blok helpera nie moze doliczyc wiecej niz jednej utraty koncentracji.
Single-flight: nie dotyczy.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: summary przy STOP ma byc oparte na realnych helper activities z czasu aktywnej sesji, nie na zgadywaniu.
Observability: test helper summary i `gate:local`.

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
- [x] Zwrocic wiecej helper activities dla sesji.
- [x] Dodac helper focus summary i klasyfikacje prywatne / distraction / work.
- [x] Pokazac summary w `StopDialog`.
- [x] Uruchomic `npm run gate:local`.

## Weryfikacja
Komendy:
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
Co zmieniono: dodano lokalne podsumowanie helpera dla aktywnej sesji, maskowanie prywatnych kontekstow, klasyfikacje rozpraszaczy i licznik utrat koncentracji pokazywany przy STOP.
Jak sprawdzono: `npm run gate:local`
PASS / FAIL: PASS
Ryzyka: summary jest agregatem pomocniczym przy STOP, nie rozcina jeszcze jednej sesji na wiele zapisanych rekordow.
Follow-up: jesli bedzie potrzebne, kolejny slice moze zapisac takie bloki do historii sesji jako osobny kontrakt.
