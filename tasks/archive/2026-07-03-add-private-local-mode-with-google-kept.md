# Archived Task

Closed At: 2026-07-03T10:37:49.939Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-add-private-local-mode-with-google-kept
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Dodac Private local mode obok obecnego Google+Convex cloud mode bez usuwania loginu Google.

## Kryteria sukcesu
- Uzytkownik moze na starcie wybrac Cloud sync albo Private local
- Private local wstaje bez bootstrapu/auth Convexa, gdy lokalnie brak `VITE_CONVEX_URL`
- Google login zostaje zachowany jako osobny cloud path
- Local mode pozwala zapisac sesje, skasowac lokalne dane i wrocic do choosera bez runtime errorow

## Priorytet / Blocker
Największy blocker teraz: Dodac Private local mode obok obecnego Google+Convex cloud mode bez usuwania loginu Google.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: auth+storage+tracker
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/main.tsx
- src/App.tsx
- src/components/TrackerWorkspace.tsx
- src/components/SessionDialogs.tsx
- src/lib/tracker.ts
- src/lib/trackerTypes.ts
- tests/app.test.tsx
- src/index.css
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: auth+storage+tracker
Pliki: tasks/todo.md, src/main.tsx, src/App.tsx, src/components/TrackerWorkspace.tsx, src/components/SessionDialogs.tsx, src/lib/tracker.ts, src/lib/trackerTypes.ts, tests/app.test.tsx, src/index.css

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
Root cause:
- `src/main.tsx` tworzył `ConvexReactClient` eager na starcie, więc app crashowała jeszcze przed wyborem trybu, gdy lokalnie brakowało `VITE_CONVEX_URL`.
- `useTrackerWorkspaceController` traktował lokalną aktywną sesję jak cloud snapshot restore, więc pokazywał mylący banner o potwierdzeniu przez Convex.
Dowód:
- Smoke Playwright przed fixem pokazał pusty `#root` i `pageerror: No address provided to ConvexReactClient`.
- Smoke po fixie pokazał chooser, działający local mode i brak `Convex` copy w local session flow.
Aktualny flow:
- Start app -> chooser `Cloud sync + Google` / `Private local`.
- `Cloud`: lazy mount `ConvexAuthProvider` dopiero po wyborze cloud.
- `Local`: runtime trackera tylko na lokalnym stanie i localStorage, bez cloud auth/bootstrap dla danych trackera.

## Granice
Moduły dotknięte: auth+storage+tracker
Kontrakty dotknięte:
- bootstrap entry choice przed cloud auth
- local tracker state persistence
- local settings danger zone bez kasowania konta Google
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS:
- chooser renderuje się bez crasha także bez `VITE_CONVEX_URL`
- `Private local` nie wymaga loginu Google ani query/mutacji trackera do Convexa do podstawowego flow
- `Cloud sync + Google` pozostaje zachowany jako osobny path
- `Settings` w local mode pokazuje tylko kasowanie danych lokalnych
ERRORS: brak dowodu, zmiana poza scope albo failujące gate'y.
STATUSES: PASS / FAIL.
SIDE EFFECTS: tylko zmiany w plikach z allowlisty.
LOGS: komendy weryfikacyjne.
TESTS:
- `npm run typecheck`
- `npm test`
- `npm run build`
- Playwright smoke na `http://127.0.0.1:4173/`
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
State machine:
- chooser -> cloud mode
- chooser -> local mode
- local mode -> settings delete local data
- local mode -> back to chooser
Error classification:
- brak `VITE_CONVEX_URL` to local blocker tylko dla cloud path, nie dla local path
- local delete/reset nie moze udawac kasowania konta Google
Idempotency: ponowne wejscie do local mode ma odczytac albo pusty, albo ostatni lokalny stan bez duplikacji sesji.
Single-flight: nie dotyczy, brak async fetch loop w local runtime.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth:
- local mode nie pokazuje copy o syncu z Convexem ani `Usuń konto`
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
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run dev -- --host 127.0.0.1 --port 4173`
- Playwright smoke na chooser -> local mode -> start/stop -> settings delete -> back to chooser
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
Co zmieniono:
- dodano chooser cloud/local przed bootstrapem auth
- odseparowano lazy cloud mount od local runtime
- dodano lokalne persistence sesji/preferencji i local-specific settings delete copy
- usunieto mylacy banner o Convexie z local active session flow
Jak sprawdzono:
- `npm run typecheck`
- `npm test`
- `npm run build`
- Playwright smoke na localhost: chooser render, local mode, start/stop, zapis historii, local delete, powrot do choosera
PASS / FAIL: PASS
Ryzyka:
- cloud path nie byl browser-smoked w tym tasku, bo lokalnie brak `VITE_CONVEX_URL`
- local state nadal siedzi w `localStorage`, nie w `IndexedDB`
Follow-up:
- osobny smoke cloud path na srodowisku z poprawnym `VITE_CONVEX_URL`
