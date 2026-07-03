# Archived Task

Closed At: 2026-07-03T09:32:37.755Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-release-delete-settings-production
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Wypchnac na produkcje settings danger zone dla usuwania danych i konta w worktimerze.

## Kryteria sukcesu
- Aktualny commit jest na origin/master

## Priorytet / Blocker
Największy blocker teraz: Wypchnac na produkcje settings danger zone dla usuwania danych i konta w worktimerze.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: deploy+convex+pages
Tryb zmiany: release-build
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: deploy+convex+pages
Pliki: tasks/todo.md

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
Root cause: funkcja delete-data/delete-account byla gotowa lokalnie i zacommitowana, ale bez push/deploy nie trafiala ani do Convex prod, ani do publicznego frontendu Pages.
Dowód: `git log -1 --oneline` wskazywał lokalny commit `3175afe feat: add tracker data deletion settings`, a README wymaga osobnego `convex deploy` i `wrangler pages deploy dist`.
Aktualny flow: lokalny commit na `master` -> `git push origin master` -> `npx convex deploy` na `bold-lyrebird-441` -> build z prod `VITE_CONVEX_URL` -> `wrangler pages deploy dist` -> publiczny smoke na `worktimer-5gn.pages.dev`.

## Granice
Moduły dotknięte: deploy+convex+pages
Kontrakty dotknięte: release kontrakt backendu Convex prod i publicznego frontendu Cloudflare Pages.
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: spełnione kryteria sukcesu.
ERRORS: brak dowodu, zmiana poza scope albo failujące gate'y.
STATUSES: PASS / FAIL.
SIDE EFFECTS: tylko zmiany w plikach z allowlisty.
LOGS: komendy weryfikacyjne.
TESTS: do uzupełnienia przed końcem taska.
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
State machine: `local commit -> pushed master -> convex deploy -> pages build -> pages deploy -> public smoke`.
Error classification: push fail, build fail, backend deploy fail, pages deploy fail, smoke fail.
Idempotency: ponowny deploy tego samego commitu jest bezpieczny.
Single-flight: nie dotyczy poza pojedynczym manualnym deployem.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: dowodem publicznym jest HTTP 200 na prod URL oraz bundle z frazami settings/delete na publicznej domenie.
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
- `git push origin master`
- `tmp=$(mktemp) && printf 'CONVEX_DEPLOYMENT=bold-lyrebird-441\n' > "$tmp" && npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL --env-file "$tmp" && rm -f "$tmp"`
- `VITE_CONVEX_URL=https://bold-lyrebird-441.convex.cloud npm run build`
- `npx wrangler pages deploy dist --project-name worktimer --branch main --commit-dirty true`
- `curl -I https://worktimer-5gn.pages.dev`
- `curl -s https://worktimer-5gn.pages.dev | rg "index-2VHXZQpL\.js|index-BA-BkY06\.css"`
- `curl -s https://worktimer-5gn.pages.dev/assets/index-2VHXZQpL.js | rg "Usuń dane z chmury|Usuń konto|Settings i prywatność"`
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
Co zmieniono: wypchnięto commit `3175afe` na `origin/master`, wdrożono backend na Convex prod `bold-lyrebird-441` i frontend na Cloudflare Pages `worktimer-5gn.pages.dev`.
Jak sprawdzono: `git push origin master`, `npx convex deploy`, build z prod `VITE_CONVEX_URL`, `wrangler pages deploy dist`, `curl -I https://worktimer-5gn.pages.dev`, `curl` + `rg` dla publicznego HTML i bundle `index-2VHXZQpL.js`.
PASS / FAIL: PASS
Ryzyka: smoke był HTTP/bundle-level, bez pełnego klikalnego browser proof dla logowania i wejścia do settings dialogu.
Follow-up: jeśli chcesz, następnym krokiem mogę zrobić browser smoke produkcji: login, otwarcie settings i sprawdzenie danger zone na żywo.
