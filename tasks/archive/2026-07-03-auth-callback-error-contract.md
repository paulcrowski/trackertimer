# Archived Task

Closed At: 2026-07-03T12:56:40.279Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-auth-callback-error-contract
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Błąd callbacku OAuth ma być jawnie widoczny w UI zamiast znikać w console i wyglądać jak zwykły stan wylogowania.

## Kryteria sukcesu
- Po błędzie callbacku OAuth użytkownik widzi jawny komunikat i może ponowić logowanie z czystego stanu.

## Priorytet / Blocker
Największy blocker teraz: Błąd callbacku OAuth ma być jawnie widoczny w UI zamiast znikać w console i wyglądać jak zwykły stan wylogowania.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: auth-callback-truth
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/main.tsx
- src/App.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: auth-callback-truth
Pliki: tasks/todo.md, src/main.tsx, src/App.tsx, tests/app.test.tsx

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
Root cause: krytyczny callback OAuth dzieje się przed renderem Reacta w `src/main.tsx`, ale jego błąd kończy się tylko `console.error`. UI dostaje zwykły ekran logowania/trybu pracy bez sygnału, że callback się wywalił.
Dowód: `finishOAuthRedirect()` jest wołane przed `renderApp()`, a `.catch(...)` tylko loguje błąd i zawsze robi `.finally(renderApp)`. `CloudApp` pokazuje błędy tylko z własnego lokalnego stanu Reactowego, więc startupowy błąd callbacku nie ma kanału do UI.
Aktualny flow: Google callback zwraca `?code=` -> `auth:signIn` failuje -> kod loguje błąd do konsoli -> aplikacja renderuje się jak zwykły stan wylogowania.

## Granice
Moduły dotknięte: `src/main.tsx`, `src/App.tsx` i test renderu.
Kontrakty dotknięte: startup auth callback ma przekazać jawny błąd do UI; po failu użytkownik ma widzieć prawdę i dostać czysty retry path.
Poza zakresem: sign-out guard, przebudowa całego auth bootstrapu, zmiana dostawcy auth, refactor storage.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: błąd callbacku OAuth jest czytelnie widoczny w UI, nie ginie w `console`, a użytkownik może ponowić logowanie z oczyszczonym callback URL.
ERRORS: app dalej wygląda jak zwykły ekran wylogowania mimo faila callbacku, albo po błędzie zostaje brudny `?code=` bez clean retry.
STATUSES: PASS / FAIL.
SIDE EFFECTS: tylko startup auth/UI; bez zmiany tracker runtime.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak `code` ma dalej kończyć się no-opem bez fałszywego błędu.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: ponowne wejście po błędzie nie może zależeć od zostawionego callback URL.
Concurrent request: startup callback jest single-shot przed renderem; nie dokładamy drugiego równoległego flow.
Partial write: nie może być stanu “tokenów brak, UI też nie wie, że to błąd”.
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
State machine: `callback with code -> attempt token exchange -> success clears URL and boots app` albo `failure clears URL and boots app with visible startup error`.
Error classification: callback failure to jawny błąd auth bootstrapu, nie neutralny stan wylogowania.
Idempotency: po failu retry ma wrócić do zwykłego kliknięcia `Zaloguj przez Google`, nie do automatycznej powtórki ze starym `code`.
Single-flight: jeden bootstrap callback przed renderem.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: auth screen lub ekran wyboru trybu musi umieć pokazać startupowy błąd callbacku.
Observability: test renderu błędu + lokalne gate'y.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/App.tsx`, `tests/app.test.tsx`
LOC: ~500 / ~800
Dlaczego zmiana trafia tutaj: `AuthScreen` żyje w `src/App.tsx`, a kontrakt renderu auth błędów jest testowany w jednym pliku integracyjnym.
Czy plik ma wiele odpowiedzialności: tak.
Minimalny fix: przepchnąć startup error przez istniejące propsy zamiast robić nowy subsystem auth errors.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: niskie-średnie.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `src/App.tsx`, `tests/app.test.tsx`
LOC: ~500 / ~800
Obecne odpowiedzialności: app shell/local mode/auth screen oraz testy kontraktowe wielu paneli.
Czy task dokłada nową odpowiedzialność: nie; tylko domyka startup error contract.
Minimalny fix bez rozbicia: tak.
Małe wydzielenie odpowiedzialności: opcjonalne później dla auth bootstrapu, ale poza zakresem.
Ryzyko minimalnego fixu: niskie.
Ryzyko wydzielenia: niepotrzebne dla tego scope.
Rekomendacja: nie rozbijać teraz.

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
Co zmieniono: startup callback OAuth zwraca teraz jawny błąd do Reacta zamiast chować go w `console`, czyści `?code=` także po failu i pokazuje komunikat na auth screenie albo ekranie wyboru trybu. `CloudApp` przyjmuje startup error jako stan początkowy UI.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local` (w tym `lint`, `typecheck`, `test`, `build`).
PASS / FAIL: PASS
Ryzyka: bez live symulacji z realnym Google callbackiem; kontrakt jest jednak bezpośrednio potwierdzony przez kod i render testu.
Follow-up: osobny task na guard `Zmień sesję` przy aktywnej sesji.
