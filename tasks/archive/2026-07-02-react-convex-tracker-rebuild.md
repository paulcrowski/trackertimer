# Archived Task

Closed At: 2026-07-02T17:12:46.493Z
Result: FAIL
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-react-convex-tracker-rebuild
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
STRUCTURE_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Przebudowac tracker do modularnej aplikacji React/Convex bez legacy shell w index.html, z pelnym feature setem podstawowego trackera.

## Kryteria sukcesu
- Index.html jest cienkim shellem

## Priorytet / Blocker
Największy blocker teraz: Przebudowac tracker do modularnej aplikacji React/Convex bez legacy shell w index.html, z pelnym feature setem podstawowego trackera.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: frontend-app-shell
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- index.html
- src/**
- convex/**
- tests/**
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: frontend-app-shell
Pliki: index.html, src/**, convex/**, tests/**, tasks/todo.md, tasks/archive/**

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
Root cause: repo mial dwa rownolegle shelle aplikacji. Legacy HTML trzymal style, layout i stare flow localStorage, a React/Convex doklejal sie obok jako czesciowy runtime.
Dowód: index.html mial 2185 LOC i zawieral ukryty legacy app shell, inline CSS, modale, wykresy i logike DOM/localStorage, podczas gdy src/App.tsx obslugiwal tylko waski wycinek funkcji.
Aktualny flow: cienki index.html -> src/main.tsx auth bootstrap -> modularny React UI -> Convex jako zrodlo prawdy dla sesji i preferencji.

## Granice
Moduły dotknięte: frontend-app-shell, tracker data contract
Kontrakty dotknięte: bootstrap/start/stop/savePreferences/addManualSession/updateSession/deleteSession w convex/tracker.ts oraz trackerPreferences w convex/schema.ts.
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
State machine: PAUSED -> ACTIVE -> STOP_DIALOG -> SAVED oraz ACTIVE -> IDLE_AUTO_STOP -> SAVED.
Error classification: auth/session validation jako non-retryable ConvexError; brak retry loopow dla walidacji i danych.
Idempotency: brak wielokrotnego startu przy aktywnej sesji; delete/update sprawdzaja ownership.
Single-flight: jedna aktywna sesja per user przez index by_user + guard w start.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: UI czyta sesje, summary, charts i preferences z bootstrap query; local state jest tylko warstwa formularzy i optimistic prefs.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: src/components/TrackerWorkspace.tsx, convex/tracker.ts
LOC: 411, 329
Dlaczego zmiana trafia tutaj: to sa obecne seams dla orchestration UI i kontraktu trackera po wycieciu legacy shell.
Czy plik ma wiele odpowiedzialności: umiarkowanie tak, ale mniej niz poprzedni index.html.
Minimalny fix: zachowac orchestration w jednym komponencie i jednym module backendowym dla tego slica.
Czy potrzebne wydzielenie odpowiedzialności: tak, jako follow-up po przejsciu guard budgetu.
Ryzyko: kolejny feature bez dalszego podzialu znow zacznie powiekszac god files.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: index.html przed zmiana
LOC: 2185
Obecne odpowiedzialności: shell dokumentu, theme, layout, legacy DOM app, localStorage persistence, modale, wykresy, export CSV, idle logic, focus mode
Czy task dokłada nową odpowiedzialność: NIE
Minimalny fix bez rozbicia: usunac legacy shell i zostawic cienki dokument HTML
Małe wydzielenie odpowiedzialności: src/components/**, src/lib/tracker.ts, Convex contract
Ryzyko minimalnego fixu: niskie po przeniesieniu kompletnego UI do src/**
Ryzyko wydzielenia: srednie, bo zmiana jest szeroka i wychodzi poza budzet diff-size jednego taska
Rekomendacja: utrzymac nowy direction, ale kolejny slice podzielic dalej na mniejsze taski

## Dependency Direction Guard
Czy zmiana odwraca zależność?
NIE

Czy Business Logic importuje UI/DB/framework?
NIE

Czy adapter przecieka do core?
NIE

## Change Isolation
Ile modułów dotyka zmiana: UI shell, component tree, style layer, Convex contract, tests.
Czy to naturalne: tak dla tej przebudowy, ale za duze na jeden budzet workflow.
Czy da się ograniczyć zmianę do jednego kontraktu: nie w pelnym zakresie 1+2+3+4, dlatego gate:local wymusza re-plan.

## Plan
- [x] Przeczytać pliki z allowlisty.
- [x] Wykonać najmniejszą bezpieczną zmianę.
- [x] Uruchomić weryfikację.

## Weryfikacja
Komendy:
npm run typecheck
npm test
npm run build
npm run check:godfiles
npm run check:import-boundaries
npm run gate:local
Expected result: typecheck PASS, test PASS, build PASS, import boundaries PASS, gate:local FAIL na diff-size budget.

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
Co zmieniono: wycieto legacy shell z index.html, przeniesiono UI do modularnego Reacta, odbudowano brakujace funkcje trackera i poszerzono kontrakt Convex o preferences/manual/edit/delete.
Jak sprawdzono: npm run typecheck PASS, npm test PASS, npm run build PASS, npm run check:godfiles PASS z warningami >300 LOC, npm run check:import-boundaries PASS, npm run gate:local FAIL na check:diff-size.
PASS / FAIL: FAIL
Ryzyka: repo guard nadal blokuje zamkniecie taska, bo zakres 1+2+3+4 przekroczyl AI-safe budget jednego taska; brak browser smoke przez zablokowany chrome-devtools profil i brak playwright w zaleznosciach.
Follow-up: podzielic dalsze porzadkowanie na mniejsze taski, zwlaszcza rozbic TrackerWorkspace i convex/tracker.ts albo relandowac ten zakres jako sekwencje mniejszych commitow/taskow.
