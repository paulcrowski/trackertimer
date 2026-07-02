# Archived Task

Closed At: 2026-07-02T13:21:49.707Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-import-clean-workflow
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
STRUCTURE_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Zaimportowac workflow pracy z cleanWorkflow do repo time tracker bez naruszania aplikacji.

## Kryteria sukcesu
- Workflow jest w repo.
- Hooki sa podpiete.
- `npm run gate:local` przechodzi.

## Priorytet / Blocker
Największy blocker teraz: Zaimportowac workflow pracy z cleanWorkflow do repo time tracker bez naruszania aplikacji.
Dowód blockera: polecenie uzytkownika i stan poczatkowy repo bez workflow.
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Modul: workflow import
Tryb zmiany: code-change
Maksymalny zakres plikow: allowlista z taska
Dozwolone pliki do zmiany:
- package.json
- package-lock.json
- .githooks/**
- .github/**
- AGENTS.md
- AGENT_DEV_POLICY.md
- CLAUDE.md
- CODEX.md
- ParkingLot.md
- RELEASE_GATE.md
- TESTING.md
- docs/**
- scripts/**
- tasks/**
- tests/**
- workflow/**
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlista
Czego nie ruszac: pliki poza zakresem

## Zakres
Modul: workflow import
Pliki: package.json, package-lock.json, .githooks/**, .github/**, AGENTS.md, AGENT_DEV_POLICY.md, CLAUDE.md, CODEX.md, ParkingLot.md, RELEASE_GATE.md, TESTING.md, docs/**, scripts/**, tasks/**, tests/**, workflow/**

## Reprodukcja / dowód problemu
Repo nie mialo plikow workflow, task lifecycle, gate'ow ani konfiguracji git wymaganej przez guardy.

## Escalation
Czy brakuje danych do bezpiecznej zmiany?
NIE

Jesli TAK:
Brakujace dane: brak
Czego nie da sie potwierdzic: brak
Ryzyko kodowania teraz: niskie po utrzymaniu scope locka
Najmniejszy nastepny krok: wykonac najmniejsza zmiane z allowlisty

## Klasyfikacja
REQUIRED

Uzasadnienie:
Zmiana jest wymagana dla aktualnego stanu repo.

## Diagnoza
Root cause: repo `time tracker` nie mialo zaimportowanego workflow, task lifecycle, gate'ow ani konfiguracji `git`, przez co praca agenta nie byla mechanicznie ograniczona.
Dowod: w stanie poczatkowym brakowalo `AGENTS.md`, `docs/`, `scripts/`, `tasks/`, `workflow/`, `.githooks/` i skryptow `gate:*` w `package.json`.
Aktualny flow: workflow zostal przeniesiony z `cleanWorkflow`, dopasowany do projektu Vite/React i zweryfikowany przez `npm run gate:local`.

## Granice
Moduly dotkniete: workflow import, package scripts, minimalny test projektu.
Kontrakty dotkniete: task lifecycle, local/pr gates, import boundaries, project verification.
Poza zakresem: kod aplikacji poza minimalnym testem i integracja runtime.

## Kontrakt
INPUT: polecenie uzytkownika i pliki z allowlisty.
SUCCESS: workflow dziala lokalnie i przechodzi gate.
ERRORS: brak dowodu, zmiana poza scope albo failujace gate'y.
STATUSES: PASS / FAIL.
SIDE EFFECTS: tylko zmiany w plikach z allowlisty oraz lokalna inicjalizacja repo git.
LOGS: `npm install`, `npm run hooks:install`, `npm run gate:local`.
TESTS: `lint`, `typecheck`, `test`, `build`, `check:import-boundaries`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwac i pokazac ostatni bezpieczny stan.
Null/missing data: nie zgadywac, uzyc ESCALATION.
Invalid schema: nie dotyczy, chyba ze task dotyka danych.
Duplicate request: nie dotyczy.
Concurrent request: nie dotyczy.
Partial write: nie zostawiac pustego sukcesu.
Worker crash: nie dotyczy.
Retry loop: nie dodawac retry bez klasyfikacji bledow.
Provider unavailable: nie dotyczy.

## Guard Scope
REQUIRED GUARDS:
- trzymac sie allowlisty.
- uruchomic testy wskazane w tasku.

NICE_TO_HAVE GUARDS:
- pomysly poza zakresem zapisac do ParkingLot.md.

OVERBUILD GUARDS:
- nie tworzyc nowego subsystemu poza zaimportowanym workflow.

ParkingLot.md updated:
NOT_NEEDED

## Runtime guards
State machine: nie dotyczy.
Error classification: nie dotyczy.
Idempotency: nie dotyczy.
Single-flight: nie dotyczy.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: zachowane; aplikacja nie byla zmieniana funkcjonalnie.
Observability: komendy weryfikacyjne jako dowod.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
NIE

Jesli TAK:
Plik: brak
LOC: brak
Dlaczego zmiana trafia tutaj: brak
Czy plik ma wiele odpowiedzialnosci: brak
Minimalny fix: brak
Czy potrzebne wydzielenie odpowiedzialnosci: brak
Ryzyko: brak

## GOD_FILE_CHECK
Wymagane, jesli plik >500 LOC.

Plik: brak
LOC: brak
Obecne odpowiedzialnosci: brak
Czy task doklada nowa odpowiedzialnosc: brak
Minimalny fix bez rozbicia: brak
Male wydzielenie odpowiedzialnosci: brak
Ryzyko minimalnego fixu: brak
Ryzyko wydzielenia: brak
Rekomendacja: brak

## Dependency Direction Guard
Czy zmiana odwraca zaleznosc?
NIE

Czy Business Logic importuje UI/DB/framework?
NIE

Czy adapter przecieka do core?
NIE

## Change Isolation
Ile modulow dotyka zmiana: jeden obszar workflow plus minimalny test projektu.
Czy to naturalne: tak.
Czy da sie ograniczyc zmiane do jednego kontraktu: tak.

## Plan
- [x] Przeczytac pliki z allowlisty.
- [x] Wykonac najmniejsza bezpieczna zmiane.
- [x] Uruchomic weryfikacje.

## Weryfikacja
Komendy:
- `npm install`
- `npm run hooks:install`
- `npm run gate:local`
Expected result: PASS.

## Definition of Done
- [x] test PASS
- [x] build PASS albo NOT_NEEDED z uzasadnieniem
- [x] brak ERROR w logach
- [x] zmiana nie wychodzi poza zakres
- [x] brak refaktoru przy okazji
- [x] failure modes obslucone
- [x] brak silent fallbackow
- [x] brak empty success
- [x] UI truth zachowane, jesli dotyczy
- [x] dependency direction zachowany
- [x] brak cyklicznych zaleznosci
- [x] duze pliki nie zostaly powiekszone bez uzasadnienia
- [x] implementowano tylko REQUIRED GUARDS

## Review / Wyniki
Co zmieniono: zaimportowano workflow z `cleanWorkflow`, dodano gate'y i task lifecycle do repo, dopasowano workflow do `type: module`, Windows oraz obecnej struktury Vite/React, a takze dodano minimalny test `tsx --test`.
Jak sprawdzono: `npm run gate:local` PASS; w srodku przeszly `lint`, `typecheck`, `test`, `build` oraz `check:import-boundaries`.
PASS / FAIL: PASS
Ryzyka: task pozostaje `ACTIVE`, dopoki zmiany nie zostana zatwierdzone albo task nie zostanie jawnie zamkniety po commicie.
Follow-up: po zatwierdzeniu zmian mozna uruchomic `npm run task:close -- --result PASS` albo zrobic to w ramach nastepnego kroku z commitem.
