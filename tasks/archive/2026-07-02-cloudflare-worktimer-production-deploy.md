# Archived Task

Closed At: 2026-07-02T18:56:39.720Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-cloudflare-worktimer-production-deploy
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Wystawić tracker jako nową stronę Cloudflare pod marką worktimer, bez naruszania istniejących projektów, z działającym Convex auth i publicznym URL do smoke testu.

## Kryteria sukcesu
- Nowy frontend jest publicznie dostępny jako osobna strona Cloudflare i łączy się z dedykowanym Convex deploymentem dla worktimer.

## Priorytet / Blocker
Największy blocker teraz: Wystawić tracker jako nową stronę Cloudflare pod marką worktimer, bez naruszania istniejących projektów, z działającym Convex auth i publicznym URL do smoke testu.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: deploy+convex+auth
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- convex/auth.ts
- convex/_generated/api.d.ts
- src/App.tsx
- src/components/SessionDialogs.tsx
- src/lib/tracker.ts
- src/index.css
- index.html
- .env.example
- README.md
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: deploy+convex+auth
Pliki: tasks/todo.md, convex/auth.ts, convex/_generated/api.d.ts, src/App.tsx, src/components/SessionDialogs.tsx, src/lib/tracker.ts, src/index.css, index.html, .env.example, README.md, tests/app.test.tsx

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
Root cause: aplikacja byla zablokowana na Google-only auth i starym brandingu, a swiezy prod Convex nie mial kluczy JWT wymaganych przez Convex Auth.
Dowód: publiczny smoke poczatkowo zwracal `[CONVEX A(auth:signIn)] Server Error`, a logi Convex wskazaly `Missing environment variable JWT_PRIVATE_KEY`.
Aktualny flow: Cloudflare Pages `worktimer-5gn.pages.dev` -> anonymous Convex auth -> `tracker.bootstrap` -> workspace -> `start/stop` sesji.

## Granice
Moduły dotknięte: deploy+convex+auth
Kontrakty dotknięte: do uzupełnienia, jeśli dotyczy.
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
State machine: landing `Otwórz worktimer` -> auth handshake -> `Ładowanie danych trackera...` -> workspace -> `START` -> stop modal -> `Zapisz sesję`.
Error classification: poczatkowy auth error byl non-retryable config error (`JWT_PRIVATE_KEY` missing), po ustawieniu env auth/signIn i `tracker.bootstrap` wykonaly sie poprawnie.
Idempotency: deploy i env set wykonane na osobnym projekcie `worktimer`, bez dotykania innych deploymentow.
Single-flight: nie dodawano nowej wspolbieznosci ani retry loopow.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: smoke potwierdzil prawidlowe przejscie od landingu do workspace oraz zapis sesji w historii.
Observability: `npm test`, `npm run gate:local`, `npx convex deploy`, `wrangler pages deploy`, browser smoke, `npx convex logs --deployment bold-lyrebird-441 --history 30 --success`.

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
- [ ] Przeczytać pliki z allowlisty.
- [ ] Wykonać najmniejszą bezpieczną zmianę.
- [ ] Uruchomić weryfikację.

## Weryfikacja
Komendy:
- `npm test`
- `npm run clean`
- `npm run gate:local`
- `npm run build`
- `npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL` na deployment `bold-lyrebird-441`
- `npx wrangler pages project create worktimer --production-branch main`
- `npx wrangler pages deploy dist --project-name worktimer --branch main --commit-dirty true`
- browser smoke na `https://worktimer-5gn.pages.dev`
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
Co zmieniono: auth provider przelaczony na oficjalny `Anonymous`, branding zmieniony na `worktimer`, eksport CSV i testy dostosowane, prod Convex `worktimer` utworzony i uzupelniony o `JWT_PRIVATE_KEY`/`JWKS`, frontend wdrozony jako osobny Cloudflare Pages project `worktimer`.
Jak sprawdzono: `npm test` PASS, `npm run gate:local` PASS, `npm run build` PASS, `npx convex deploy` PASS, `wrangler pages deploy` PASS, browser smoke PASS dla landingu, wejscia do workspace oraz `START`/`Zapisz sesję`, logi Convex pokazuja sukces `auth:signIn`, `tracker:bootstrap`, `tracker:stop`.
PASS / FAIL: PASS
Ryzyka: w historii console browser plugin zostal stary wpis bledu z pierwszej nieudanej proby przed ustawieniem kluczy, ale nowe logi Convex po fixie nie pokazaly nowych errorow.
Follow-up: jesli ten deploy ma byc pozniej kontem per-user zamiast demo, kolejny task powinien przywrocic zewnetrzny provider i przejsc pelny setup OAuth dla osobnej marki `worktimer`.
