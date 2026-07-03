# Archived Task

Closed At: 2026-07-03T16:38:22.754Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-private-local-storage-guard
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Zablokować Private local bez zapisywalnego localStorage i pokazać jawny błąd zamiast pozornego successu.

## Kryteria sukcesu
- Private local nie daje się uruchomić ani auto-wznowić bez zapisywalnego localStorage; UI pokazuje prawdziwy powód; testy przechodzą.

## Priorytet / Blocker
Największy blocker teraz: Zablokować Private local bez zapisywalnego localStorage i pokazać jawny błąd zamiast pozornego successu.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: auth+local-storage
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- src/main.tsx
- src/lib/startupMode.ts
- tests/app.test.tsx
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: auth+local-storage
Pliki: src/main.tsx, src/lib/startupMode.ts, tests/app.test.tsx

## Reprodukcja / dowód problemu
- `src/main.tsx` przechowuje wybór trybu w `browserStorage`, które ma fallback do `sessionStorage` albo cookies.
- `src/lib/tracker.ts` dla local trackera czyta i zapisuje stan tylko przez `window.localStorage`, a gdy storage jest niedostępny zwraca `null` albo no-op.
- Efekt: użytkownik może wejść w `Private local`, ale po reloadzie albo już od startu nie ma żadnej gwarancji trwałego zapisu sesji, mimo że UI komunikuje local-only persistence.

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
Root cause: entry flow dopuszcza `Private local` na podstawie storage fallbacku dla wyboru trybu, ale nie weryfikuje, czy właściwy storage trackera (`localStorage`) jest realnie zapisywalny.
Dowód: `browserStorage` w `src/main.tsx` ma fallback poza `localStorage`, a local tracker state używa tylko `window.localStorage`; testy potwierdzają teraz, że bez writable storage local mode ma zostać zablokowany.
Aktualny flow: startup sprawdza teraz zapisywalny `localStorage` przed auto-resume i przed wejściem w `Private local`; przy braku storage czyści lokalny wybór trybu i pokazuje jawny błąd.

## Granice
Moduły dotknięte: auth+local-storage
Kontrakty dotknięte: startup mode choice, auto-resume `Private local`, entry copy dla unavailable local storage.
Poza zakresem: migracja local mode do IndexedDB, runtime sync danych, zmiany w modelu sesji, zmiany cloud auth flow.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: `Private local` nie uruchamia się ani nie wznawia bez zapisywalnego `localStorage`, a użytkownik widzi prawdziwy powód.
ERRORS: brak `localStorage` jest traktowany jako jawny błąd kontraktu, nie jako silent fallback.
STATUSES: mode chooser / local mode available / local mode blocked.
SIDE EFFECTS: przy wykryciu braku storage startup czyści tylko zapisany wybór trybu, bez dotykania cloud auth.
LOGS: `npm test`, `npm run typecheck`, `npm run gate:local`.
TESTS: testy startup mode resolvera i storage availability probe.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak storage blokuje local mode zamiast udawać persistence.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: ponowny wybór local mode daje ten sam jawny błąd bez zmiany stanu danych.
Concurrent request: nie dotyczy, flow jest lokalny i synchroniczny.
Partial write: startup nie zostawia local mode w aktywnym stanie bez trwałego storage.
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
State machine: `chooser -> local` tylko gdy storage probe przejdzie; `stored local -> chooser + error` gdy probe failuje na starcie.
Error classification: brak zapisywalnego `localStorage` to non-retryable `ENVIRONMENT_UNSUPPORTED` dla local mode.
Idempotency: wielokrotne sprawdzenie storage i czyszczenie zapisanego trybu daje ten sam stan końcowy.
Single-flight: nie dotyczy.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: `Private local` nie jest dostępny, jeśli tracker nie może trwale zapisać danych.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/main.tsx`
LOC: 303
Dlaczego zmiana trafia tutaj: tu żyje entry flow i wybór trybu przed renderem runtime.
Czy plik ma wiele odpowiedzialności: tak, ale ten task dotyka wyłącznie startup contract.
Minimalny fix: dodać storage probe i guard w istniejącym shellu.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: małe, bo zmiana nie rozszerza odpowiedzialności poza startup gating.

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
Co zmieniono: dodano probe dla writable `localStorage`, startup nie wznawia local mode bez tego storage, chooser blokuje `Private local` i pokazuje jawny powód, a testy obejmują nowy kontrakt.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local`.
PASS / FAIL: PASS
Ryzyka: local mode nadal używa `localStorage`, więc to guard fail-closed, nie migracja na trwalszy storage.
Follow-up: osobny task tylko jeśli chcesz podnieść local mode z `localStorage` do `IndexedDB`.
