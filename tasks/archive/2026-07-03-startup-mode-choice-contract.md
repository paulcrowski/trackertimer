# Archived Task

Closed At: 2026-07-03T15:17:57.895Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-startup-mode-choice-contract
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Na starcie produkcji user ma widzieć prawdziwy wybór Cloud sync vs Private local, zamiast być cicho wpychanym w Google flow bez aktywnego auth state.

## Kryteria sukcesu
- Persisted cloud mode auto-wznawia się tylko przy realnym auth state; bez tokenów start wraca do wyboru trybu.

## Priorytet / Blocker
Największy blocker teraz: Na starcie produkcji user ma widzieć prawdziwy wybór Cloud sync vs Private local, zamiast być cicho wpychanym w Google flow bez aktywnego auth state.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: startup-mode-choice-contract
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/main.tsx
- src/lib/startupMode.ts
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: startup-mode-choice-contract
Pliki: tasks/todo.md, src/main.tsx, src/lib/startupMode.ts, tests/app.test.tsx

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
Root cause: startup decyzji o trybie ufał bezwarunkowo zapisowi `worktimer.storage-mode`. Jeśli w storage zostało `cloud`, a auth tokeny już nie istniały, app omijał chooser i wchodził prosto w cloud auth screen, co z perspektywy usera wyglądało jak brak opcji `Private local`.
Dowód: `RootApp` w `src/main.tsx` inicjalizował `mode` bezpośrednio z `readStorageMode()`, bez sprawdzenia czy istnieje jeszcze jakikolwiek cloud auth state w `__convexAuthJWT` albo `__convexAuthRefreshToken`.
Aktualny flow: zapisany `local` dalej wznawia local mode, ale zapisany `cloud` auto-wznawia się tylko wtedy, gdy storage ma realny token albo refresh token; w przeciwnym razie start wraca do `ModeChoiceScreen`.

## Granice
Moduły dotknięte: startup-mode-choice-contract
Kontrakty dotknięte: startup mode resolution w `src/main.tsx`, czysty helper rozstrzygania trybu w `src/lib/startupMode.ts`, test startup mode contract.
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: zapisany `storageMode` i ewentualny stored cloud auth state.
SUCCESS: zapisany `cloud` nie omija chooser bez aktywnego auth state; zapisany `local` nadal wznawia local mode.
ERRORS: start nie może udawać, że `cloud` jest jedynym dostępnym wyborem, jeśli runtime nie ma już czego wznowić po stronie auth.
STATUSES: chooser / auto-cloud / auto-local.
SIDE EFFECTS: brak zmian w auth providerze ani local trackerze; tylko truthfulness startup decision.
LOGS: `npm test`, `npm run typecheck`, `npm run gate:local`.
TESTS: jednostkowy test helpera rozstrzygającego startup mode i pełny lokalny gate.
DONE: review ma konkretny wynik PASS i archive zachowuje dowód.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak tokenów przy zapisanym `cloud` musi prowadzić do chooser, nie do cichego cloud-only entry.
Invalid schema: `storageMode` spoza `cloud/local` dalej jest ignorowany.
Duplicate request: wielokrotne odczytanie startup helpera ma być deterministyczne dla tych samych danych wejściowych.
Concurrent request: nie dotyczy, startup decision jest lokalna i synchroniczna.
Partial write: brak side-effectów poza odczytem storage; task usuwa pusty sukces typu „remembered cloud without auth”.
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
State machine: `storedMode=local -> local`; `storedMode=cloud + authState -> cloud`; `storedMode=cloud + no authState -> chooser`; `storedMode=null -> chooser`.
Error classification: brak auth state to nie błąd Google, tylko warunek powrotu do chooser.
Idempotency: helper startup mode jest czysto pochodny i deterministyczny.
Single-flight: nie dotyczy, brak fetch/job orchestration.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: start nie może pokazywać tylko Google, jeśli produkt obiecuje dwa tryby i nie ma aktywnego cloud state do wznowienia.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `tests/app.test.tsx`
LOC: ~1172
Dlaczego zmiana trafia tutaj: istniejące testy kontraktowe app entry siedzą już w tym pliku.
Czy plik ma wiele odpowiedzialności: tak.
Minimalny fix: dodać mały test helpera startup mode bez przebudowy pakietu testów.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: dalszy mały wzrost pliku testowego, ale scope pozostaje jeden kontrakt startupu.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `tests/app.test.tsx`
LOC: ~1172
Obecne odpowiedzialności: testy kontraktowe UI, helperów i runtime seams.
Czy task dokłada nową odpowiedzialność: nie, tylko kolejny test kontraktu startup flow.
Minimalny fix bez rozbicia: nowy test helpera i osobny mały helper runtime w `src/lib/startupMode.ts`.
Małe wydzielenie odpowiedzialności: zrobione tylko tyle, ile trzeba do testowalności startupu.
Ryzyko minimalnego fixu: niskie.
Ryzyko wydzielenia: niskie, bo helper jest mały i czysto pochodny.
Rekomendacja: zostawić helper jako testowalny seam, bez szerszego refactoru entrypointu.

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
Co zmieniono: startup mode resolution dostał testowalny helper; `main.tsx` auto-wznawia `cloud` tylko wtedy, gdy storage ma realny cloud auth state, a bez tokenów wraca do chooser z wyborem `Cloud sync + Google` i `Private local`.
Jak sprawdzono: `npm test` PASS, `npm run typecheck` PASS, `npm run gate:local` PASS.
PASS / FAIL: PASS
Ryzyka: ten fix nie zmienia jeszcze aktywnego runtime po już wykonanym `signOut` w tej samej sesji przeglądarki; dotyczy prawdy startupu i odświeżonego wejścia.
Follow-up: jeśli chcesz, następny osobny slice może po `signOut` od razu czyścić `cloud` mode i wracać do chooser bez potrzeby refreshu.
