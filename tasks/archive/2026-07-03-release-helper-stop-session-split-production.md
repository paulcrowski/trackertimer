# Archived Task

Closed At: 2026-07-03T10:17:25.133Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-release-helper-stop-session-split-production
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Wypchnac na produkkcje split zapisu sesji helpera przy STOP w worktimerze.

## Kryteria sukcesu
- Aktualny commit jest na origin/master

## Priorytet / Blocker
Największy blocker teraz: Wypchnac na produkkcje split zapisu sesji helpera przy STOP w worktimerze.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: deploy+convex+pages
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- convex/tracker.ts
- convex/trackerModel.ts
- src/lib/tracker.ts
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: deploy+convex+pages
Pliki: tasks/todo.md, convex/tracker.ts, convex/trackerModel.ts, src/lib/tracker.ts, tests/app.test.tsx, tasks/archive/**

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
Root cause: split zapisu sesji helpera byl gotowy lokalnie w commicie `6d0b5e2`, ale bez push/deploy nie trafial ani do Convex prod, ani do publicznego frontendu Pages.
Dowód: `git log -1 --oneline` pokazal lokalny commit `6d0b5e2 feat: split stopped helper sessions`, a README wymaga osobnego `git push origin master`, `npx convex deploy` i `wrangler pages deploy dist`.
Aktualny flow: lokalny commit na `master` -> `git push origin master` -> `npx convex deploy` na `bold-lyrebird-441` -> build z prod `VITE_CONVEX_URL` -> `wrangler pages deploy dist` -> publiczny smoke na `worktimer-5gn.pages.dev`.

## Granice
Moduły dotknięte: deploy+convex+pages
Kontrakty dotknięte: release kontrakt backendu Convex prod i publicznego frontendu Cloudflare Pages dla splitu `praca / prywatne / rozproszenie`.
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: commit jest na `origin/master`, Convex prod i publiczny frontend Pages serwuja build ze splitem zapisu sesji helpera.
ERRORS: brak push, fail backend deploy, fail pages deploy albo brak publicznego smoke proof.
STATUSES: PASS / FAIL.
SIDE EFFECTS: nowy commit git, nowy deploy Convex prod i nowy build Cloudflare Pages.
LOGS: komendy weryfikacyjne.
TESTS: `npm run gate:local`, deploy i smoke publiczny.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: nie zgadywać URL ani statusu release.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: ponowny deploy tego samego commitu jest bezpieczny, ale trzeba raportowac finalny stan publiczny.
Concurrent request: nie dotyczy poza pojedynczym manualnym deployem.
Partial write: nie zostawiać "wdrozone" bez publicznego smoke proof.
Worker crash: nie dotyczy, chyba że task dotyka workera.
Retry loop: nie dodawać retry bez klasyfikacji błędów.
Provider unavailable: pokazac konkretny blad `git push`, Convex albo Cloudflare.

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
State machine: `local commit -> pushed master -> convex deploy -> pages build -> pages deploy -> public smoke`.
Error classification: push fail, build fail, convex deploy fail, pages deploy fail, smoke fail.
Idempotency: ponowny deploy tego samego commitu jest bezpieczny.
Single-flight: nie dotyczy.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: dowodem publicznym jest HTTP 200 na `worktimer-5gn.pages.dev`, hash `index-w624Ftik.js` w publicznym HTML i obecność fraz `prywatna domena`, `Automatyczny blok helpera`, `prywatne`, `rozproszenie` w publicznym bundle.
Observability: `git push`, log Convexa, log Pages deploya i `curl` smoke.

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
- `npm run gate:local`
- `git push origin master`
- `tmp=$(mktemp) && printf 'CONVEX_DEPLOYMENT=bold-lyrebird-441\n' > "$tmp" && npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL --env-file "$tmp"; rc=$?; rm -f "$tmp"; exit $rc`
- `VITE_CONVEX_URL=https://bold-lyrebird-441.convex.cloud npm run build`
- `npx wrangler pages deploy dist --project-name worktimer --branch main --commit-dirty true`
- `curl -I https://worktimer-5gn.pages.dev`
- `curl -s https://worktimer-5gn.pages.dev`
- `curl -s https://worktimer-5gn.pages.dev/assets/index-w624Ftik.js | rg "Automatyczny blok helpera|prywatne|rozproszenie|Prywatna domena"`
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
Co zmieniono: wypchnieto commit `6d0b5e2` na `origin/master`, wdrozono backend na Convex prod `bold-lyrebird-441` i frontend na Cloudflare Pages `worktimer-5gn.pages.dev`.
Jak sprawdzono: `npm run gate:local`, `git push origin master`, `npx convex deploy`, build z prod `VITE_CONVEX_URL`, `wrangler pages deploy dist`, `curl -I https://worktimer-5gn.pages.dev`, `curl` publicznego HTML i bundle `index-w624Ftik.js`.
PASS / FAIL: PASS
Ryzyka: smoke byl HTTP/bundle-level, bez klikalnego browser proof po zalogowaniu i bez zapisu nowej sesji na produkcji.
Follow-up: jesli chcesz, nastepnym krokiem moge zrobic browser smoke na produkcji: login, start/stop sesji i sprawdzenie rozdzielenia `Codex / Signal`.
