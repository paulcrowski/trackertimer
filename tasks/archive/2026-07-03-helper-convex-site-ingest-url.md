# Archived Task

Closed At: 2026-07-03T08:18:50.564Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-helper-convex-site-ingest-url
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Zrealizować task: helper-convex-site-ingest-url.

## Kryteria sukcesu
- Task ma dowód PASS.

## Priorytet / Blocker
Największy blocker teraz: Zrealizować task: helper-convex-site-ingest-url.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: desktop helper ingest URL
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- tasks/archive/**
- src/lib/tracker.ts
- tests/app.test.tsx
- worktimer-helper.mjs
Kontrakty do przeczytania: AGENTS.md, docs/ARCHITECTURE_GUARDS.md oraz tylko potrzebne pliki dla taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: backend Convexa, helper capture logic i pliki poza zakresem

## Zakres
Moduł: desktop helper ingest URL
Pliki: tasks/todo.md, src/lib/tracker.ts, tests/app.test.tsx, worktimer-helper.mjs

## Reprodukcja / dowód problemu
- `node worktimer-helper.mjs --url "https://bold-lyrebird-441.convex.cloud/api/desktop/activity" ...` zwraca stale `HTTP 404`.
- `npx convex function-spec` dla deploymentu `bold-lyrebird-441` pokazuje, ze `POST /api/desktop/activity` istnieje.
- `curl -X POST https://bold-lyrebird-441.convex.cloud/api/desktop/activity` zwraca `404`.
- `curl -X POST https://bold-lyrebird-441.convex.site/api/desktop/activity` zwraca `401 Missing helper key`, czyli realny host HTTP action to `convex.site`.

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
Root cause: builder helpera tworzy URL z hostem `*.convex.cloud`, ale HTTP actions sa wystawione pod `*.convex.site`.
Dowód: prod function spec zawiera route `POST /api/desktop/activity`, a ten sam path na `convex.site` odpowiada 401 zamiast 404.
Aktualny flow: UI generuje klucz -> UI buduje ingest URL -> helper POSTuje sample -> prod route przyjmuje dane.

## Granice
Moduły dotknięte: frontendowy kontrakt helper ingest URL i jego test
Kontrakty dotknięte: `buildDesktopHelperIngestUrl`
Poza zakresem: deploy Convexa, route backendu, auth helper key i desktop capture

## Kontrakt
INPUT: `VITE_CONVEX_URL` z hostem `*.convex.cloud`.
SUCCESS: helper ingest URL wskazuje `*.convex.site/api/desktop/activity`.
ERRORS: dalsze budowanie `*.convex.cloud` albo regresja dla innych hostow.
STATUSES: PASS / FAIL.
SIDE EFFECTS: UI pokazuje nowa komende helpera i nowe startery z poprawnym hostem.
LOGS: komendy weryfikacyjne.
TESTS: test jednostkowy buildera URL i lokalny gate.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: nie zgadywać hosta przy pustym albo niepoprawnym URL.
Invalid schema: nie dotyczy.
Duplicate request: nie dotyczy.
Concurrent request: nie dotyczy.
Partial write: nie zostawiać pustego sukcesu.
Worker crash: nie dotyczy.
Retry loop: nie dotyczy.
Provider unavailable: helper ma dostawać poprawny host; nie dodajemy retry.

## Guard Scope
REQUIRED GUARDS:
- trzymać się allowlisty.
- naprawić tylko mapowanie hosta `convex.cloud -> convex.site`.
- uruchomić `npm run gate:local`.

NICE_TO_HAVE GUARDS:
- pomysły poza zakresem zapisać do ParkingLot.md.

OVERBUILD GUARDS:
- nie tworzyć nowego subsystemu bez osobnego taska.

ParkingLot.md updated:
NOT_NEEDED

## Runtime guards
State machine: `cloud URL` -> normalize host -> helper POST do route.
Error classification: obecny `404` to INVALID_ENDPOINT_HOST, nie auth ani permission issue.
Idempotency: nie dotyczy.
Single-flight: nie dotyczy.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: helper command i starter musza wskazywac ten sam poprawny ingest URL.
Observability: `curl` dla `convex.site`, test buildera i `gate:local`.

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
- [ ] Zmienic builder ingest URL na `convex.site`.
- [ ] Zaktualizowac test kontraktu.
- [ ] Uruchomic `npm run gate:local`.

## Weryfikacja
Komendy:
- `npm run gate:local`
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
Co zmieniono: `buildDesktopHelperIngestUrl` mapuje host `*.convex.cloud` na `*.convex.site` dla helper HTTP action; test kontraktu zaktualizowany.
Jak sprawdzono: `curl -X POST https://bold-lyrebird-441.convex.site/api/desktop/activity` zwraca `401 Missing helper key`, a `npm run gate:local` przeszedl.
PASS / FAIL: PASS
Ryzyka: lokalny wrapper `worktimer-helper.mjs` pozostaje niezatwierdzony osobno, ale nie koliduje z tym fixem hosta.
Follow-up: po wdrozeniu frontend helper command i starter pack beda generowaly poprawny host `convex.site`.
