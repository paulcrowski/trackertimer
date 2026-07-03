# Archived Task

Closed At: 2026-07-03T12:44:05.067Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-helper-quick-start-freshness-contract
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Start z helpera ma działać tylko na świeżym i aktywnym sygnale helpera, bez startu ze starego albo wstrzymanego kontekstu.

## Kryteria sukcesu
- Quick start z helpera nie używa starego ani spauzowanego sygnału.

## Priorytet / Blocker
Największy blocker teraz: Start z helpera ma działać tylko na świeżym i aktywnym sygnale helpera, bez startu ze starego albo wstrzymanego kontekstu.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: helper-quick-start-truth
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/lib/tracker.ts
- src/components/TrackerPanels.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: helper-quick-start-truth
Pliki: tasks/todo.md, src/lib/tracker.ts, src/components/TrackerPanels.tsx, tests/app.test.tsx

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
Root cause: quick start z helpera ma dwa różne kontrakty prawdy. Sugestia projektu jest liczona tylko dla świeżego i aktywnego helpera, ale sam przycisk `Start z helpera` oraz handler startu patrzą jedynie na `lastAppName/lastDomain`, więc mogą wystartować sesję ze starego albo świadomie spauzowanego sygnału.
Dowód: `DesktopHelperPanel` włącza przycisk przy samym `lastAppName/lastDomain`, a `handleQuickStartFromHelper` buduje opis z `data.desktopHelper.lastDomain ?? data.desktopHelper.lastAppName` bez sprawdzenia `connected`, `desktopTrackingEnabled` ani pause state.
Aktualny flow: helper wysłał aktywność wcześniej albo tracking jest pauzowany -> UI nadal ma ostatni kontekst -> użytkownik klika `Start z helpera` -> sesja startuje z opisem wyglądającym na aktualny, choć runtime nie ma świeżego sygnału.

## Granice
Moduły dotknięte: `src/lib/tracker.ts`, `src/components/TrackerPanels.tsx` i testy kontraktu.
Kontrakty dotknięte: quick start z helpera działa tylko przy aktywnym trackingu i świeżym heartbeatcie helpera; stale/offline/pauza nie mogą wyglądać jak gotowy start.
Poza zakresem: backend helpera, reguły sugestii projektu, nowy system toastów/błędów i przebudowa copy całego panelu.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: `Start z helpera` jest możliwy tylko wtedy, gdy helper jest połączony, tracking włączony i nie jest spauzowany; w przeciwnym razie UI nie obiecuje gotowego startu.
ERRORS: quick start dalej startuje ze starego sygnału, albo UI i handler mają różne warunki.
STATUSES: PASS / FAIL.
SIDE EFFECTS: brak zmian w backendzie; tylko uszczelnienie warunku startu i jawniejszy brak startu poza kontraktem.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak świeżego helper source ma blokować quick start zamiast zgadywać opisu.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: wieloklik dalej idzie przez istniejący `busyAction=start`.
Concurrent request: nie dokładamy nowego wyścigu; tylko sprawdzamy stan przed startem.
Partial write: brak świeżego sygnału nie może kończyć się pozornym sukcesem z wygenerowanym opisem.
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
State machine: `helper active -> quick start enabled -> start session`; `helper offline/paused/disabled -> quick start disabled -> brak startu z helpera`.
Error classification: stale/offline helper to normalny stan kontraktu, nie aktywny kontekst do startu.
Idempotency: bez zmian względem istniejącego startu sesji.
Single-flight: istniejący `busyAction=start` pozostaje jedyną blokadą.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: przycisk i handler muszą korzystać z tego samego warunku świeżości helpera.
Observability: test helpera i render disabled button jako dowód kontraktu.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/lib/tracker.ts`, `tests/app.test.tsx`
LOC: ~1450 / ~760
Dlaczego zmiana trafia tutaj: controller i helpery prawdy dla quick startu już siedzą w `src/lib/tracker.ts`, a testy kontraktu są w jednym pliku integracyjnym.
Czy plik ma wiele odpowiedzialności: tak, szczególnie controller.
Minimalny fix: dodać współdzielony helper warunku startu zamiast nowego modułu.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: średnie przez rozmiar plików, niskie funkcjonalnie przez wąski kontrakt.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `src/lib/tracker.ts`, `tests/app.test.tsx`
LOC: ~1450 / ~760
Obecne odpowiedzialności: controller, helpery UI, storage snapshoty, CSV, auto-pause, focus summary i testy kontraktowe wielu paneli.
Czy task dokłada nową odpowiedzialność: nie; domyka istniejący kontrakt quick startu helpera.
Minimalny fix bez rozbicia: wspólny helper warunku startu użyty przez UI i controller.
Małe wydzielenie odpowiedzialności: możliwe później dla helper contracts, ale poza tym taskiem.
Ryzyko minimalnego fixu: niskie.
Ryzyko wydzielenia: wysokie względem scope tego fixa.
Rekomendacja: nie rozbijać teraz.

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
Co zmieniono: quick start z helpera korzysta teraz ze wspólnego helpera świeżości używanego przez UI i controller; przycisk jest disabled dla offline/pauza/wyłączonego trackingu, a handler nie wystartuje sesji z martwego sygnału i pokaże jawny komunikat. Dodatkowo panel helpera nie crashuje już przy braku `VITE_CONVEX_URL`, tylko pokazuje brak skonfigurowanego ingest URL.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local` (w tym `lint`, `typecheck`, `test`, `build`).
PASS / FAIL: PASS
Ryzyka: nadal nie ma osobnego systemu toastów, więc komunikat o zablokowanym quick starcie używa istniejącego bannera notice; to jest świadomy minimalny fix.
Follow-up: osobny task, jeśli chcesz rozdzielić ogólne błędy akcji od `idleNotice` i dać dedykowany feedback channel dla helpera.
