# Archived Task

Closed At: 2026-07-03T15:28:48.314Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-cloud-signout-return-to-chooser
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Po cloud sign-out app ma wrócić do wyboru trybu bez refreshu, zamiast zostawać w cloud-only auth screen.

## Kryteria sukcesu
- Udany cloud sign-out czyści persisted cloud mode i przełącza runtime z powrotem na chooser; błąd sign-out nie udaje sukcesu.

## Priorytet / Blocker
Największy blocker teraz: Po cloud sign-out app ma wrócić do wyboru trybu bez refreshu, zamiast zostawać w cloud-only auth screen.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: cloud-signout-return-to-chooser
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/main.tsx
- src/App.tsx
- src/lib/startupMode.ts
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: cloud-signout-return-to-chooser
Pliki: tasks/todo.md, src/main.tsx, src/App.tsx, src/lib/startupMode.ts, tests/app.test.tsx

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
Root cause: cloud `onSignOut` kończył się tylko na `signOut()` z auth providerem. Po sukcesie runtime zostawał w `mode === 'cloud'`, więc ekran przechodził najwyżej do cloud auth screen zamiast wrócić do chooser trybu.
Dowód: `CloudApp` wywoływał samo `signOut()`, a `RootApp` czyścił `storageMode` tylko dla wyjścia z local mode albo ręcznego wyboru trybu, nigdy po cloud sign-out.
Aktualny flow: udany cloud sign-out najpierw kończy sesję auth, a potem czyści persisted mode i przełącza runtime na chooser; jeśli sign-out failuje, mode nie jest czyszczony i błąd nie udaje sukcesu.

## Granice
Moduły dotknięte: cloud-signout-return-to-chooser
Kontrakty dotknięte: cloud `onSignOut` w `src/App.tsx`, handoff do chooser w `src/main.tsx`, testowalny helper `signOutToModeChoice` w `src/lib/startupMode.ts`.
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: klik cloud sign-out przy braku aktywnej sesji i poprawnym auth provider flow.
SUCCESS: po udanym sign-out app czyści persisted cloud mode i natychmiast wraca do chooser; po błędzie sign-out chooser się nie otwiera i user dostaje błąd.
ERRORS: sign-out nie może zostawiać usera w cloud-only auth screen, jeśli produkt obiecuje powrót do wyboru trybu.
STATUSES: signed-in cloud -> sign-out pending -> chooser albo error.
SIDE EFFECTS: czyszczenie `storageMode` po sukcesie sign-out; brak zmian w local data ani auth callback flow.
LOGS: `npm test`, `npm run typecheck`, `npm run gate:local`.
TESTS: helper test dla success/failure sign-out oraz pełny lokalny gate.
DONE: review ma konkretny wynik PASS i archive zachowuje dowód.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak callbacku czyszczącego mode nie może udawać poprawnego powrotu do chooser.
Invalid schema: nie dotyczy; task używa istniejącego `StorageMode`.
Duplicate request: helper ma czyścić mode dopiero po sukcesie `signOut`, nie przed.
Concurrent request: task nie dodaje nowej współbieżności; sekwencja jest liniowa `signOut -> clear mode`.
Partial write: brak pustego sukcesu typu „auth sign-out failed but chooser already opened” albo „auth sign-out succeeded but mode nadal cloud”.
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
State machine: `cloud signed-in -> signOut()`; success -> `clearStoredMode()` -> chooser; failure -> error surface, bez zmiany mode.
Error classification: błąd auth provider sign-out jest terminalny dla tej akcji i nie czyści chooser state.
Idempotency: helper wykonuje `clearStoredMode` dokładnie po jednym udanym sign-out.
Single-flight: nie dotyczy, brak fetch/job orchestration.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: label `Wyloguj` nie może kończyć się ekranem, który nadal ukrywa `Private local`.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/App.tsx`, `tests/app.test.tsx`
LOC: ~583, ~1197
Dlaczego zmiana trafia tutaj: cloud sign-out seam siedzi w `CloudApp`, a jego kontrakt testowy w zbiorczym pliku testów.
Czy plik ma wiele odpowiedzialności: tak.
Minimalny fix: mały helper orchestration plus podpięcie callbacku do istniejących propsów.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: dokładanie kolejnego małego diffu do dużego `App.tsx`, ale bez nowego subsystemu.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `src/App.tsx`, `tests/app.test.tsx`
LOC: ~583, ~1197
Obecne odpowiedzialności: app shells, cloud/local entry, local mode actions, testy kontraktowe UI i runtime seams.
Czy task dokłada nową odpowiedzialność: nie, tylko domyka istniejący flow sign-out.
Minimalny fix bez rozbicia: mały helper `signOutToModeChoice` i callback z `main.tsx`.
Małe wydzielenie odpowiedzialności: zrobione tylko na poziomie helpera orchestration, bez przebudowy app shelli.
Ryzyko minimalnego fixu: niskie.
Ryzyko wydzielenia: niskie i kontrolowane.
Rekomendacja: wystarczający minimalny fix teraz.

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
Co zmieniono: cloud sign-out przechodzi teraz przez helper `signOutToModeChoice`; po udanym `signOut` callback z `main.tsx` czyści persisted mode i wraca do chooser, a przy błędzie mode zostaje nienaruszony. Dodano test success/failure tego helpera.
Jak sprawdzono: `npm test` PASS, `npm run typecheck` PASS, `npm run gate:local` PASS.
PASS / FAIL: PASS
Ryzyka: ten slice nie zmienia jeszcze copy ani UX choosera po powrocie; domyka tylko runtime truth i brak potrzeby refreshu.
Follow-up: jeśli chcesz, kolejny mały task może dodać lekki komunikat po wylogowaniu typu „Wybierz tryb ponownie”, ale to już `CONTENT_FIX`, nie runtime.
