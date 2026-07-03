# Archived Task

Closed At: 2026-07-03T10:03:10.784Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-helper-stop-session-split
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Przy STOP zapisac sesje jako osobne bloki pracy i prywatnych kontekstow zamiast jednego zbiorczego rekordu.

## Kryteria sukcesu
- Signal i Codex zapisują się jako osobne rekordy sesji po STOP

## Priorytet / Blocker
Największy blocker teraz: Przy STOP zapisac sesje jako osobne bloki pracy i prywatnych kontekstow zamiast jednego zbiorczego rekordu.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: helper stop split
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- convex/_generated/dataModel.d.ts
- convex/tracker.ts
- convex/schema.ts
- convex/trackerModel.ts
- src/lib/tracker.ts
- src/lib/trackerTypes.ts
- src/components/SessionsPanel.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: helper stop split
Pliki: tasks/todo.md, convex/tracker.ts, convex/schema.ts, convex/trackerModel.ts, src/lib/tracker.ts, src/lib/trackerTypes.ts, src/components/SessionsPanel.tsx, tests/app.test.tsx

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
Root cause: `stop` w `convex/tracker.ts` zawsze robił jeden `ctx.db.insert('sessions', ...)`, więc helperowe przełączenia typu `Codex -> Signal -> Codex` kończyły jako jeden zbiorczy rekord.
Dowód: lokalny kod przed zmianą zapisywał pojedynczą sesję, a helperowe klasyfikacje prywatności istniały tylko we frontendowym summary przy STOP.
Aktualny flow: helper aktywności -> backend buduje bloki `work / prywatne / rozproszenie` -> `stop` zapisuje osobne rekordy sesji -> summary/charts/dashboard liczą tylko kategorie pracy.

## Granice
Moduły dotknięte: `convex/tracker.ts`, `convex/trackerModel.ts`, frontendowa klasyfikacja helpera i testy.
Kontrakty dotknięte: zapis `tracker.stop`, kategorie sesji `prywatne` / `rozproszenie`, metryki summary/dashboard/category/trend oraz prywatne maskowanie helpera.
Poza zakresem: nowe tabele, sekundowe pola czasu w schemie, pełny zapis każdej aplikacji osobno i migracje legacy sesji.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: `Signal` i `Codex` po STOP lądują jako osobne rekordy historii, a prywatne / rozpraszające bloki nie zawyżają metryk pracy.
ERRORS: brak helper coverage, sesja z wcześniejszą pauzą albo diff poza scope powodują fallback do jednego bezpiecznego rekordu albo FAIL gate'a.
STATUSES: PASS / FAIL.
SIDE EFFECTS: `stop` może zapisać kilka rekordów `sessions` zamiast jednego.
LOGS: komendy weryfikacyjne.
TESTS: `npm run gate:local`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak helper sample albo brak pokrycia początku sesji wraca do jednego bezpiecznego rekordu zamiast zgadywać split.
Invalid schema: nie dotyczy, bo zmiana nie dokłada nowego pola do `sessions`.
Duplicate request: drugie `stop` nadal kończy się `Brak aktywnej sesji do zatrzymania`.
Concurrent request: nie dotyczy poza standardową serializacją mutacji Convexa.
Partial write: zapis wielu rekordów dzieje się w jednej mutacji Convexa, więc nie zostawia połowicznego stanu.
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
State machine: `activeSession -> helper blocks|fallback single block -> insert sessions -> delete activeSession`.
Error classification: brak helper coverage albo `pausedSeconds > 0` to bezpieczny fallback, nie retry.
Idempotency: bez nowego klucza; obecny kontrakt `stop` pozostaje single-shot, drugi call po sukcesie failuje na braku aktywnej sesji.
Single-flight: nie dotyczy.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: historia ma pokazywać osobne rekordy przez opis/kategorię, a summary/charts/dashboard nie mają liczyć `prywatne` / `rozproszenie` jako pracy.
Observability: dowód z `npm run gate:local`, w tym `lint`, `typecheck`, `test`, `build`.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `convex/tracker.ts`, `convex/trackerModel.ts`, `tests/app.test.tsx`, `src/lib/tracker.ts`
LOC: ~1116 / ~311 / ~461 / ~1218
Dlaczego zmiana trafia tutaj: `stop` i summary/helper classification już żyją na tych seamach.
Czy plik ma wiele odpowiedzialności: tak, ale nowy diff został ścięty do minimalnego kontraktu split/fallback.
Minimalny fix: split w backendzie, mały filtr kategorii w metrykach, jedna poprawka prywatnej domeny w helper summary.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku, bo diff-size był już graniczny i rozbicie byłoby osobnym `STRUCTURE_FIX`.
Ryzyko: dalsze dokładanie logiki do `convex/tracker.ts` powinno iść już przez osobny split modułu.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `convex/tracker.ts`, `src/lib/tracker.ts`
LOC: ~1116, ~1218
Obecne odpowiedzialności: tracker auth/bootstrap/preferences/helper ingest/stop flow oraz frontend controller/helper summary/storage snapshot.
Czy task dokłada nową odpowiedzialność: tak, ale tylko na istniejącym seamie `stop` i prywatnej klasyfikacji.
Minimalny fix bez rozbicia: lokalny helper splitu w backendzie i jedna poprawka klasyfikacji `Prywatna domena`.
Małe wydzielenie odpowiedzialności: odłożone; wymagałoby osobnego taska na wyjęcie logiki helper split/classification.
Ryzyko minimalnego fixu: umiarkowane przez rozmiar plików, zredukowane testami i gate'ami.
Ryzyko wydzielenia: większy diff i wyjście poza aktualny blocker.
Rekomendacja: zaakceptować minimal fix, a ewentualny dalszy split plików zrobić osobno.

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
Co zmieniono: `tracker.stop` rozcina helperową sesję na rekordy `praca / prywatne / rozproszenie`, a metryki pracy ignorują nowe kategorie niepracowe; dodatkowo frontend summary traktuje sentinel `Prywatna domena` jako prywatny kontekst.
Jak sprawdzono: `npm run gate:local` (`check:task`, `check:task-freshness`, `check:scope`, `check:diff-size`, `check:godfiles`, `lint`, `typecheck`, `test`, `build`, `check:import-boundaries`).
PASS / FAIL: PASS
Ryzyka: jeśli sesja miała wcześniejsze pauzy albo helper nie pokrywa początku sesji, backend świadomie wraca do jednego rekordu zamiast zgadywać split sekundowy.
Follow-up: osobny `STRUCTURE_FIX`, jeśli logika splitu/helpera dalej urośnie i będzie trzeba wyciągnąć ją z `convex/tracker.ts`.
