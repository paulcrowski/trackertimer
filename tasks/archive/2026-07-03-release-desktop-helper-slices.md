# Archived Task

Closed At: 2026-07-03T08:56:20.884Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-release-desktop-helper-slices
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Zrealizować task: release-desktop-helper-slices.

## Kryteria sukcesu
- Task ma dowód PASS.

## Priorytet / Blocker
Największy blocker teraz: Zrealizować task: release-desktop-helper-slices.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: desktop-helper release
Tryb zmiany: release-build
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- tasks/archive/**
- src/components/SessionDialogs.tsx
- src/components/TrackerWorkspace.tsx
- src/lib/tracker.ts
- tests/app.test.tsx
- worktimer-helper.mjs
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: backend Convex, auth flow i pliki poza zakresem

## Zakres
Moduł: desktop-helper release
Pliki: tasks/todo.md, tasks/archive/**, src/components/SessionDialogs.tsx, src/components/TrackerWorkspace.tsx, src/lib/tracker.ts, tests/app.test.tsx, worktimer-helper.mjs

## Reprodukcja / dowód problemu
- Lokalnie helper ma juz wrapper bez repo, poprawiony ingest URL i summary przy STOP.
- Zmiany nie sa jeszcze zatwierdzone w git ani wypchniete na produkcyjny Cloudflare Pages.

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
Root cause: helperowe slice sa gotowe lokalnie, ale repo i produkcja nadal stoja na starym stanie bez nowego startera i summary przy STOP.
Dowód: `git status` pokazuje niezatwierdzone pliki, a README wymaga osobnego buildu i `wrangler pages deploy dist` dla publicznego frontendu.
Aktualny flow: lokalny diff -> commit -> push -> merge do `master` -> build z `VITE_CONVEX_URL` -> Pages deploy -> publiczny smoke.

## Granice
Moduły dotknięte: git release path i publiczny frontend helpera
Kontrakty dotknięte: helper startup command, helper ingest URL i STOP summary w publicznym buildzie
Poza zakresem: dodatkowe zmiany kodu, Convex deploy, nowe funkcje poza aktualnym diffem

## Kontrakt
INPUT: gotowy lokalny diff helpera oraz dostep do gita i Cloudflare Pages deploy.
SUCCESS: zmiany sa zatwierdzone, wypchniete, zmergowane do `master`, produkcyjny build jest wdrozony i publicznie dostepny.
ERRORS: fail gate, fail git push/merge, fail build, fail deploy albo brak smoke proof.
STATUSES: PASS / FAIL.
SIDE EFFECTS: nowy commit git i nowy publiczny build Pages.
LOGS: komendy weryfikacyjne, log deploya i smoke proof.
TESTS: `npm run gate:local`, produkcyjny build i publiczny smoke.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: nie zgadywać, użyć ESCALATION.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: kolejny deploy tej samej paczki jest akceptowalny, ale raportuje sie finalny publiczny stan.
Concurrent request: nie dotyczy.
Partial write: nie zostawiać pustego sukcesu.
Worker crash: nie dotyczy, chyba że task dotyka workera.
Retry loop: nie dodawać retry bez klasyfikacji błędów.
Provider unavailable: pokazac konkretny blad git albo deploya.

## Guard Scope
REQUIRED GUARDS:
- trzymać się allowlisty.
- uruchomic `npm run gate:local`.
- zbudowac frontend z `VITE_CONVEX_URL=https://bold-lyrebird-441.convex.cloud`.
- potwierdzic publiczny smoke po deployu.

NICE_TO_HAVE GUARDS:
- pomysły poza zakresem zapisać do ParkingLot.md.

OVERBUILD GUARDS:
- nie tworzyć nowego subsystemu bez osobnego taska.

ParkingLot.md updated:
NOT_NEEDED

## Runtime guards
State machine: local diff -> gate -> branch commit -> push -> merge -> prod build -> Pages deploy -> publiczny smoke.
Error classification: gate fail, git fail, build fail, deploy fail, smoke fail.
Idempotency: ponowny deploy tej samej paczki jest bezpieczny.
Single-flight: nie dotyczy.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: publiczny frontend ma pokazywac helper starter bez repo i summary przy STOP.
Observability: `git log`, `gate:local`, log deploya i publiczny HTTP smoke.

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
- [x] Potwierdzic lokalny gate dla aktualnego diffu helpera.
- [x] Zbudowac i wdrozyc publiczny frontend na Cloudflare Pages.
- [x] Potwierdzic publiczny smoke i zamknac task.
- [x] Zrobic branch, commit, push i merge do `master`.

## Weryfikacja
Komendy:
- `npm run gate:local`
- `VITE_CONVEX_URL=https://bold-lyrebird-441.convex.cloud npm run build`
- `npx wrangler pages deploy dist --project-name worktimer --branch main --commit-dirty true`
- `curl -I https://worktimer-5gn.pages.dev`
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
Co zmieniono: wypchnieto publiczny frontend z wrapperem `worktimer-helper.mjs`, poprawionym URL helper ingest pod `.convex.site` i summary helpera przy STOP z prywatnymi kontekstami oraz licznikiem utrat koncentracji.
Jak sprawdzono: `npm run gate:local`, `VITE_CONVEX_URL=https://bold-lyrebird-441.convex.cloud npm run build`, `npx wrangler pages deploy dist --project-name worktimer --branch main --commit-dirty true`, `curl -I https://worktimer-5gn.pages.dev`, `curl -s https://worktimer-5gn.pages.dev | rg "index-C5q8MoVZ\\.js"`, `curl -s https://worktimer-5gn.pages.dev/assets/index-C5q8MoVZ.js | rg "Utraty koncentracji|Prywatna aplikacja|convex.site|worktimer-helper.mjs"`, `git push -u origin codex/release-desktop-helper-slices`, `git merge --ff-only codex/release-desktop-helper-slices`, `git push origin master`.
PASS / FAIL: PASS
Ryzyka: brak dodatkowego browser smoke po zalogowaniu, ale publiczny bundle i helper strings sa potwierdzone.
Follow-up: brak.
