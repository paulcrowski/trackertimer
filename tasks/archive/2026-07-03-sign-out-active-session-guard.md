# Archived Task

Closed At: 2026-07-03T12:59:58.230Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-sign-out-active-session-guard
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Wylogowanie w cloud mode nie może wyglądać jak bezpieczna zmiana konta, jeśli istnieje aktywna sesja trackera.

## Kryteria sukcesu
- Przy aktywnej sesji cloud sign-out jest blokowany jawnym komunikatem

## Priorytet / Blocker
Największy blocker teraz: Wylogowanie w cloud mode nie może wyglądać jak bezpieczna zmiana konta, jeśli istnieje aktywna sesja trackera.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: sign-out-session-truth
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/components/TrackerWorkspace.tsx
- src/App.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: sign-out-session-truth
Pliki: tasks/todo.md, src/components/TrackerWorkspace.tsx, src/App.tsx, tests/app.test.tsx

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
Root cause: headerowy sign-out w cloud mode zna stan aktywnej sesji (`controller.activeSession`), ale go ignoruje. UI obiecuje zmianę konta/sesji, podczas gdy runtime może zostawić aktywny timer w chmurze.
Dowód: `TrackerWorkspace` przekazuje `active={Boolean(controller.activeSession)}` do headera, ale `onSignOut` robi bezpośrednio `controller.handleSignOut()`. W cloud mode `App.tsx` opisuje ten przycisk jako `Zmień sesję`.
Aktualny flow: użytkownik ma aktywną sesję -> widzi `Pracuję` i przycisk `Zmień sesję` -> klika sign-out -> auth się wylogowuje, ale sesja trackera nadal istnieje po stronie cloud.

## Granice
Moduły dotknięte: `src/components/TrackerWorkspace.tsx`, `src/App.tsx` i test kontraktu.
Kontrakty dotknięte: cloud sign-out nie może wyglądać jak bezpieczna zmiana konta przy aktywnej sesji; copy przycisku ma odpowiadać realnemu efektowi.
Poza zakresem: callback OAuth, backend `stop/pause`, confirm dialog sign-out, local mode.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: przy aktywnej sesji w cloud mode sign-out nie wykona się i pokaże jawny komunikat; gdy sesji nie ma, zwykłe wylogowanie nadal działa.
ERRORS: active session dalej pozwala na sign-out bez guardu albo copy nadal sugeruje coś innego niż wylogowanie.
STATUSES: PASS / FAIL.
SIDE EFFECTS: tylko UI/auth guard; bez zmian w modelu danych.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak aktywnej sesji ma nie blokować sign-outu.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: wieloklik nie może obchodzić guardu.
Concurrent request: guard działa w UI przed wywołaniem auth sign-out.
Partial write: nie może być stanu “user wylogowany, ale nie wiedział, że zostawił aktywną sesję”.
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
State machine: `cloud + activeSession -> show guard error, no sign-out`; `cloud + no activeSession -> sign-out`; `local mode -> bez nowego guardu`.
Error classification: aktywna sesja przy sign-oucie to błąd kontraktu użytkownika, nie błąd auth providera.
Idempotency: kolejne kliknięcia przy aktywnej sesji tylko utrzymują guard, nie wywołują auth side effectu.
Single-flight: brak nowego równoległego flow, bo guard jest przed `handleSignOut`.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: label i zachowanie sign-outu w cloud mode muszą mówić to samo.
Observability: test helpera guardu + lokalne gate'y.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/App.tsx`, `tests/app.test.tsx`
LOC: ~520 / ~810
Dlaczego zmiana trafia tutaj: cloud sign-out label siedzi w `App.tsx`, a kontrakt testowy w pliku integracyjnym.
Czy plik ma wiele odpowiedzialności: tak.
Minimalny fix: mały helper guardu i zmiana copy.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: niskie.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `src/App.tsx`, `tests/app.test.tsx`
LOC: ~520 / ~810
Obecne odpowiedzialności: cloud/local app shell oraz testy wielu kontraktów UI.
Czy task dokłada nową odpowiedzialność: nie.
Minimalny fix bez rozbicia: tak.
Małe wydzielenie odpowiedzialności: opcjonalne później, ale niepotrzebne teraz.
Ryzyko minimalnego fixu: niskie.
Ryzyko wydzielenia: niepotrzebny scope creep.
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
Co zmieniono: cloud sign-out sprawdza teraz, czy tracker ma aktywną sesję; jeśli tak, blokuje wylogowanie jawnym komunikatem w istniejącym bannerze błędu. Copy cloud buttona zmieniono z `Zmień sesję` na `Wyloguj`, żeby nie obiecywać zamknięcia timera.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local` (w tym `lint`, `typecheck`, `test`, `build`).
PASS / FAIL: PASS
Ryzyka: guard jest celowo po stronie UI, więc nie chroni przed ręcznym wywołaniem auth sign-out poza tym ekranem; na ten scope to wystarczający fix kontraktu produktu.
Follow-up: jeśli chcesz twardszą gwarancję, osobny task na confirm dialog albo serwerowo wymuszony stop/pause policy przed sign-outem.
