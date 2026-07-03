# Archived Task

Closed At: 2026-07-03T07:30:17.035Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-release-helper-onboarding-ui
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Wrzucic na produkcje aktualny frontend z prostym/zaawansowanym trybem oraz starterem helpera bez repo.

## Kryteria sukcesu
- Publiczny frontend worktimera serwuje aktualny build z helper starter pack i prostym disclosure ustawien zaawansowanych.

## Priorytet / Blocker
Największy blocker teraz: Zrealizować task: release-helper-onboarding-ui.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: cloudflare-pages release
Tryb zmiany: release-build
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: kod aplikacji i backend

## Zakres
Moduł: cloudflare-pages release
Pliki: tasks/todo.md

## Reprodukcja / dowód problemu
- Lokalny `gate:local` przeszedl po zmianach helper onboarding UI.
- `git status` nadal pokazuje nieopublikowane zmiany frontendowe.

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
Root cause: zmiany helper UI istnieja lokalnie, ale bez Cloudflare Pages deploy nie beda widoczne publicznie.
Dowód: README wskazuje, ze frontend trzeba zbudowac z prawdziwym `VITE_CONVEX_URL`, a potem wypchnac `wrangler pages deploy dist`.
Aktualny flow: lokalny kod -> build z prod Convex URL -> Pages deploy -> publiczny smoke.

## Granice
Moduły dotknięte: release path Cloudflare Pages
Kontrakty dotknięte: publiczny frontend ma byc zbudowany z `https://bold-lyrebird-441.convex.cloud`
Poza zakresem: backend Convex, dodatkowe zmiany kodu, refaktory

## Kontrakt
INPUT: gotowy lokalny frontend i dostep do Cloudflare Pages deploy.
SUCCESS: build i deploy przechodza, a publiczny smoke pokazuje aktualny frontend.
ERRORS: brak deploy auth, fail build, fail deploy albo brak smoke proof.
STATUSES: PASS / FAIL.
SIDE EFFECTS: nowy publiczny build Cloudflare Pages.
LOGS: komendy weryfikacyjne.
TESTS: build produkcyjny i publiczny smoke.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwac i pokazac ostatni bezpieczny stan.
Null/missing data: nie zgadywac URL ani statusu deploya.
Invalid schema: nie dotyczy.
Duplicate request: kolejny Pages deploy jest akceptowalny, ale trzeba raportowac finalny publiczny stan.
Concurrent request: nie dotyczy.
Partial write: nie zostawiac "wdrozone" bez smoke proof.
Worker crash: nie dotyczy.
Retry loop: nie dodawac automatycznych retry bez potrzeby.
Provider unavailable: pokazac konkretny blad deploya.

## Guard Scope
REQUIRED GUARDS:
- trzymac sie allowlisty.
- nie zmieniac kodu aplikacji.
- zrobic build z `VITE_CONVEX_URL=https://bold-lyrebird-441.convex.cloud`
- potwierdzic publiczny smoke po deployu.

NICE_TO_HAVE GUARDS:
- pomysły poza zakresem zapisać do ParkingLot.md.

OVERBUILD GUARDS:
- nie tworzyć nowego subsystemu bez osobnego taska.

ParkingLot.md updated:
NOT_NEEDED

## Runtime guards
State machine: local build -> pages deploy -> publiczny smoke.
Error classification: build fail, deploy fail, smoke fail.
Idempotency: ponowny deploy tej samej paczki jest bezpieczny.
Single-flight: nie dotyczy.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: publiczny frontend musi odzwierciedlac aktualny lokalny build.
Observability: log deploya i smoke HTTP.

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
- [ ] Zrobic produkcyjny build z prawdziwym Convex URL.
- [ ] Wypchnac `dist` na Cloudflare Pages.
- [ ] Zrobic publiczny smoke i zamknac task.

## Weryfikacja
Komendy:
- `VITE_CONVEX_URL=https://bold-lyrebird-441.convex.cloud npm run build`
- `npx wrangler pages deploy dist --project-name worktimer --branch main --commit-dirty true`
- `curl -I https://worktimer-5gn.pages.dev`
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
Co zmieniono: opublikowano aktualny frontend z trybem `Prosty timer`, starterem helpera bez repo i disclosure `Pokaz ustawienia zaawansowane`.
Jak sprawdzono: `VITE_CONVEX_URL=https://bold-lyrebird-441.convex.cloud npm run build`, `npx wrangler pages deploy dist --project-name worktimer --branch main --commit-dirty true`, `curl -I https://worktimer-5gn.pages.dev`, oraz smoke bundle przez `curl` i grep dla `assets/index-BEYfQTNP.js`.
PASS / FAIL: PASS
Ryzyka: kod jest wdrozony publicznie, ale lokalny git nadal ma niezatwierdzone zmiany z tych slicow.
Follow-up: jesli chcesz porzadek repo, kolejny task to commit / push tych wdrozonych zmian.
