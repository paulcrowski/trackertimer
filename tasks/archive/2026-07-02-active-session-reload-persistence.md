# Archived Task

Closed At: 2026-07-02T20:43:34.697Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-active-session-reload-persistence
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Naprawic aktywna sesje worktimera tak, aby reload strony, zamkniecie karty i ponowne wejscie nie resetowaly mierzonego czasu dla zalogowanego uzytkownika.

## Kryteria sukcesu
- Aktywna sesja po reloadzie i ponownym wejsciu dalej pokazuje czas liczony od pierwotnego startu zapisnego w Convex

## Priorytet / Blocker
Największy blocker teraz: Naprawic aktywna sesje worktimera tak, aby reload strony, zamkniecie karty i ponowne wejscie nie resetowaly mierzonego czasu dla zalogowanego uzytkownika.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: tracker-runtime
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/App.tsx
- src/components/TrackerWorkspace.tsx
- src/lib/tracker.ts
- src/lib/trackerTypes.ts
- convex/tracker.ts
- convex/trackerModel.ts
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: tracker-runtime
Pliki: tasks/todo.md, src/App.tsx, src/components/TrackerWorkspace.tsx, src/lib/tracker.ts, src/lib/trackerTypes.ts, convex/tracker.ts, convex/trackerModel.ts, tests/app.test.tsx

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
Root cause: aktywna sesja ma jedno źródło prawdy tylko w bieżącym odczycie `activeSessions` z Convex. Frontend nie utrwala lokalnie startu aktywnej sesji per użytkownik, więc po reloadzie / ponownym wejściu klient nie ma fallbacku dla `startTime`, jeśli rehydratacja z backendu zwróci `null`, będzie opóźniona albo straci ten rekord.
Dowód: `convex/tracker.ts` zapisuje `startTime` tylko do tabeli `activeSessions`, a `src/lib/tracker.ts` liczy `elapsedSeconds` wyłącznie z `data.activeSession`; brak storage key, snapshotu i logiki restore/clear na reload.
Aktualny flow: start sesji -> mutacja `tracker.start` tworzy rekord `activeSessions` -> bootstrap odczytuje `activeSession` -> controller liczy `elapsedSeconds` z `Date.now() - activeSession.startTime`; po utracie `data.activeSession` nie istnieje żadna klientowa warstwa restore.

## Granice
Moduły dotknięte: tracker-runtime
Kontrakty dotknięte: `TrackerBootstrap.user`, `ActiveSession` restore flow, lokalny snapshot aktywnej sesji po stronie klienta.
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: aktywna sesja zachowuje pierwotny `startTime` po reloadzie/powrocie do apki, backend nadal jest preferowanym źródłem prawdy, a fallback lokalny nie tworzy nowej sesji ani nie psuje stop/auto-stop.
ERRORS: brak dowodu, zmiana poza scope albo failujące gate'y.
STATUSES: PASS / FAIL.
SIDE EFFECTS: tylko zmiany w plikach z allowlisty.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`, `npm run build`, `npm run gate:local`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: jeśli backend nie zwraca aktywnej sesji, fallback lokalny może być użyty tylko gdy nie ma dowodu nowszej zakończonej sesji i snapshot należy do tego samego `userId`.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: sprawdzić idempotencję, jeśli task ma side effecty.
Concurrent request: start/stop na wielu urządzeniach nie może tworzyć nowej aktywnej sesji po stronie klienta; serwer dalej wygrywa nad snapshotem lokalnym.
Partial write: po udanym `start` trzeba zapisać snapshot lokalny, a po `stop` wyczyścić go; nie zostawiać lokalnego aktywnego stanu po zatrzymaniu sesji.
Worker crash: nie dotyczy, chyba że task dotyka workera.
Retry loop: nie dodawać retry bez klasyfikacji błędów.
Provider unavailable: nie dotyczy, chyba że task dotyka providera.

## Guard Scope
REQUIRED GUARDS:
- trzymać się allowlisty.
- zachować backend jako source of truth; fallback lokalny tylko do restore.
- uruchomić testy wskazane w tasku.

NICE_TO_HAVE GUARDS:
- pomysły poza zakresem zapisać do ParkingLot.md.

OVERBUILD GUARDS:
- nie tworzyć nowego subsystemu bez osobnego taska.

ParkingLot.md updated:
NOT_NEEDED

## Runtime guards
State machine: `idle -> server_active`, `idle -> local_recovered`, `local_recovered -> server_active`, `server_active/local_recovered -> stopped`. Nie wolno przechodzić `idle -> new active` bez `tracker.start`.
Error classification: storage read/write failure jest lokalne i nie moze blokowac stopera; błędy start/stop nadal klasyfikuje warstwa mutacji w `App.tsx`.
Idempotency: powtórne czytanie snapshotu nie może tworzyć nowej sesji; snapshot jest tylko odczytem/fallbackiem.
Single-flight: bez nowych równoległych fetchy; bootstrap pozostaje jeden.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: jeśli timer działa z fallbacka lokalnego, UI ma to jawnie zaznaczyć jako stan przywrócony z urządzenia, nie z potwierdzonego odczytu backendu.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/lib/tracker.ts`
LOC: ok. 500+
Dlaczego zmiana trafia tutaj: to obecna warstwa controllera trackera i jedyne naturalne miejsce na restore/clear aktywnej sesji.
Czy plik ma wiele odpowiedzialności: tak, ale task nie dokłada nowego subsystemu poza najbliższym flow aktywnej sesji.
Minimalny fix: dołożyć helpery snapshotu i resolve aktywnej sesji bez ruszania innych feature.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: dalszy wzrost LOC; kontrolować scope.

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
- [x] Dodać restore/clear aktywnej sesji z lokalnego snapshotu per użytkownik.
- [x] Zachować priorytet backendu i oznaczyć lokalny fallback w UI.
- [x] Uruchomić weryfikację.

## Weryfikacja
Komendy:
- `npm test`
- `npm run typecheck`
- `npm run build`
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
Co zmieniono: bootstrap zwraca teraz `user.id`, frontend zapisuje aktywną sesję do lokalnego snapshotu per `userId`, po reloadzie potrafi ją przywrócić bez zmiany `startTime`, a gdy backend zwraca potwierdzoną sesję to ona wygrywa nad fallbackiem lokalnym. Dodatkowo snapshot jest czyszczony po `stop`, a UI pokazuje notice, gdy sesja działa z restore lokalnego.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run build`, `npm run gate:local`.
PASS / FAIL: PASS
Ryzyka: jeśli rekord `activeSessions` zniknie na backendzie i użytkownik spróbuje zatrzymać sesję przywróconą tylko lokalnie, stop nadal opiera się na Convex i może zwrócić błąd zamiast zapisać sesję; to wymagałoby osobnego flow recovery, nie tego fixa.
Follow-up: można później dodać jawny recovery path typu „odtwórz lokalną sesję jako manual entry”, jeśli okaże się potrzebny w realnym usage.
