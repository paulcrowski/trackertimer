# Archived Task

Closed At: 2026-07-03T14:12:37.698Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-cross-midnight-pause-split-accuracy
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Stop sesji przez północ z pauzami ma zapisywać poprawne czasy dla każdego dnia, a nie proporcjonalny przybliżony split.

## Kryteria sukcesu
- Aktywna sesja przechowuje wystarczający ślad pauz
- Stop sesji przez północ liczy czas każdego dnia z realnych overlapów pauz, a nie z proporcji
- Ten sam kontrakt aktywnej sesji działa dla cloud i local mode

## Priorytet / Blocker
Największy blocker teraz: Stop sesji przez północ z pauzami ma zapisywać poprawne czasy dla każdego dnia, a nie proporcjonalny przybliżony split.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: cross-midnight-pause-split
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- convex/schema.ts
- convex/tracker.ts
- convex/trackerModel.ts
- src/App.tsx
- src/lib/tracker.ts
- src/lib/trackerTypes.ts
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: cross-midnight-pause-split
Pliki: tasks/todo.md, convex/schema.ts, convex/tracker.ts, convex/trackerModel.ts, src/App.tsx, src/lib/tracker.ts, src/lib/trackerTypes.ts, tests/app.test.tsx

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
Root cause: aktywna sesja trzymała tylko `pausedSeconds` i opcjonalne `pausedAt`, więc przy stopie przez północ model nie znał po której stronie północy leżała pauza. `buildStoppedSessionRecords` musiał zgadywać split dzienny proporcją zamiast policzyć realny overlap.
Dowód: `convex/schema.ts` i runtime lokalny nie przechowywały timeline pauz, a `convex/trackerModel.ts` rozdzielał `pausedSeconds` proporcjonalnie między segmenty dzienne. Dla sesji 23:50-00:20 z pauzą 23:55-00:15 stary model zapisywał około 150 s na każdy dzień zamiast 300 s i 300 s.
Aktualny flow: start tworzy aktywną sesję z pustym `pauseRanges`; pause dopisuje otwarty zakres; resume domyka ostatni zakres i dalej utrzymuje agregat `pausedSeconds`; stop przekazuje `pauseRanges` do splitu dziennego i liczy dokładny tracked time per day.

## Granice
Moduły dotknięte: cross-midnight-pause-split
Kontrakty dotknięte: kontrakt `ActiveSession` / `ActiveSessionSnapshot`, zapis `activeSessions`, stop session split w `buildStoppedSessionRecords`, local mode mirror w `src/App.tsx`.
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: aktywna sesja zawiera `startTime`, `pausedSeconds`, opcjonalne `pausedAt` i timeline `pauseRanges`; stop dostaje `endTime`.
SUCCESS: każdy rekord dzienny po stopie ma duration policzone z faktycznego tracked time po odjęciu overlapów pauz w danym dniu; lokalna i chmurowa sesja używają tego samego shape.
ERRORS: brak lub uszkodzony timeline pauz nie może udawać nowej dokładności; wtedy runtime zachowuje legacy fallback do proporcji tylko dla starych danych bez `pauseRanges`.
STATUSES: ACTIVE -> PAUSED -> ACTIVE -> STOPPED; timeline pauz może mieć tylko jeden otwarty zakres.
SIDE EFFECTS: migracja kontraktu aktywnej sesji w local storage i w Convex `activeSessions`; brak zmian w historycznych `sessions`.
LOGS: `npm test`, `npm run typecheck`, `npm run gate:local`.
TESTS: regresja dla sesji 23:50-00:20 z pauzą 23:55-00:15 oraz pełny lokalny gate.
DONE: review ma konkretny wynik PASS i task archive potwierdza zamknięcie.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: stare snapshoty albo rekordy bez `pauseRanges` są jawnie normalizowane do `[]`; dokładny split działa tylko gdy timeline istnieje.
Invalid schema: `pauseRanges` jest walidowane przy parse lokalnego stanu i w Convex schema.
Duplicate request: pause/resume nie mogą tworzyć wielu otwartych zakresów; resume domyka ostatni otwarty zakres.
Concurrent request: task nie dodaje nowej współbieżności; pilnuje jednego źródła prawdy dla cloud i local mode.
Partial write: start/pause/resume/stop aktualizują cały active session shape; brak pustego sukcesu z rozjechanym `pausedSeconds` vs `pauseRanges`.
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
State machine: `ACTIVE` bez otwartego pause range -> `PAUSED` z `pausedAt` i ostatnim `pauseRanges[endTime=null]` -> `ACTIVE` po domknięciu ostatniego range -> `STOPPED` po wyliczeniu rekordów dziennych.
Error classification: brak `pauseRanges` w starych danych to legacy-data case, nie success exactness; zły shape snapshotu dalej powoduje odrzucenie parse.
Idempotency: pause/resume/stop opierają się o aktualny active session snapshot i nie wprowadzają dodatkowych side-effectów poza pojedynczą mutacją stanu.
Single-flight: nie dotyczy, brak nowego fetch/job orchestration.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: lokalny UI i cloud runtime czytają ten sam kontrakt aktywnej sesji, więc odzyskanie sesji i stop używają tego samego timeline pauz.
Observability: komendy weryfikacyjne jako dowód.

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
Co zmieniono: aktywna sesja w local i cloud przechowuje `pauseRanges`; stop sesji przekazuje timeline pauz do `buildStoppedSessionRecords`; split dzienny odejmuje exact pause overlap per day, a stare dane bez timeline zostają na legacy fallbacku.
Jak sprawdzono: `npm test` PASS, `npm run typecheck` PASS, `npm run gate:local` PASS.
PASS / FAIL: PASS
Ryzyka: dokładność dla cross-midnight zależy od tego, czy aktywna sesja powstała już na nowym kontrakcie; stare aktywne snapshoty bez `pauseRanges` dalej użyją fallbacku proporcjonalnego, bo nie da się odzyskać utraconego timeline z samego `pausedSeconds`.
Follow-up: jeśli produkt kiedyś doda edycję albo analitykę pauz, wtedy potrzebny będzie osobny task na trwały model zdarzeń pauz, nie tylko timeline w aktywnej sesji.
