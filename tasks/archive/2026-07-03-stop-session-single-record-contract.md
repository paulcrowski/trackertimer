# Archived Task

Closed At: 2026-07-03T11:58:48.493Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-stop-session-single-record-contract
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Przy STOP zawsze zapisac jedna sesje historii, bez cichego splitu helperowego.

## Kryteria sukcesu
- STOP zapisuje jeden rekord sesji nawet gdy helper ma timeline kontekstow.

## Priorytet / Blocker
Największy blocker teraz: Przy STOP zawsze zapisac jedna sesje historii, bez cichego splitu helperowego.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: tracker-stop-contract
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- convex/tracker.ts
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: tracker-stop-contract
Pliki: tasks/todo.md, convex/tracker.ts, tests/app.test.tsx

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
Root cause: `stop` w `convex/tracker.ts` wywoluje `buildStoppedSessionRecords()` i zapisuje wszystkie zwrocone bloki jako finalne rekordy `sessions`, wiec helperowy timeline zmienia jedna akcje STOP w wiele wpisow historii.
Dowód: kod mutacji `stop` robi petle `for (const sessionRecord of sessionRecords) await ctx.db.insert('sessions', ...)`, a UI dialogu STOP nadal komunikuje pojedyncze `Zapisz sesję`.
Aktualny flow: aktywna sesja + helper activities -> backend buduje split `praca / prywatne / rozproszenie` -> `stop` zapisuje wiele rekordow -> historia uzytkownika dostaje inny kontrakt niz obiecuje UI.

## Granice
Moduły dotknięte: `convex/tracker.ts` i testy kontraktu persistence przy STOP.
Kontrakty dotknięte: `tracker.stop` ma po tej zmianie zawsze zapisywac jeden finalny rekord historii na jedno zatrzymanie sesji.
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: jedno wywolanie STOP daje jeden rekord `sessions`, niezaleznie od helperowego timeline.
ERRORS: brak aktywnej sesji, nieprawidlowy `endTime` albo zmiana poza scope.
STATUSES: PASS / FAIL.
SIDE EFFECTS: helperowy timeline moze dalej sluzyc do preview/analityki, ale nie zmienia finalnego persistence kontraktu historii.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: helper activities nie moga juz zmienic finalnego zapisu sesji.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: drugie `stop` po sukcesie nadal ma failowac na braku aktywnej sesji.
Concurrent request: kontrakt nie dodaje nowego wyścigu; dalej jest jedna mutacja Convexa.
Partial write: finalny zapis ma byc pojedynczym insertem plus usuniecie `activeSession`, bez petli po wielu rekordach.
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
State machine: `activeSession -> validate endTime -> insert single session record -> delete activeSession`.
Error classification: helper coverage lub helper klasyfikacja nie sa juz runtime deciderem dla persistence.
Idempotency: bez nowego klucza; kontrakt pozostaje single-shot, a drugi `stop` failuje.
Single-flight: do uzupełnienia, jeśli dotyczy.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: STOP nie moze po cichu zapisac innej liczby rekordow niz sugeruje UI.
Observability: dowod z testu kontraktu i typecheck.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `convex/tracker.ts`, `tests/app.test.tsx`
LOC: ~1115, ~500
Dlaczego zmiana trafia tutaj: persistence kontrakt STOP zyje tylko w backendowym `tracker.stop`, a proof siedzi w testach kontraktu.
Czy plik ma wiele odpowiedzialności: tak, szczegolnie `convex/tracker.ts`.
Minimalny fix: usunac helperowy split z finalnego persistence bez refaktoru pliku.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: dokladanie zmian do duzego pliku, ale scope jest jednoznaczny.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `convex/tracker.ts`
LOC: ~1115
Obecne odpowiedzialności: auth, bootstrap, preferences, helper ingest, STOP flow, CRUD sesji.
Czy task dokłada nową odpowiedzialność: nie, tylko przywraca wewnetrznie prostszy kontrakt STOP.
Minimalny fix bez rozbicia: wyciac split z finalnego persistence i zostawic pojedynczy insert.
Małe wydzielenie odpowiedzialności: odlozone, bo bylby to osobny `STRUCTURE_FIX`.
Ryzyko minimalnego fixu: niskie-srednie przez rozmiar pliku.
Ryzyko wydzielenia: wyjscie poza scope.
Rekomendacja: minimalny fix teraz, bez przebudowy modulu.

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
- `npm run gate:local`
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
Co zmieniono: `tracker.stop` przestal budowac helperowy split i znow zapisuje jeden finalny rekord sesji; dodany test kontraktu dla buildera pojedynczego rekordu.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local` (w tym `lint`, `typecheck`, `test`, `build`).
PASS / FAIL: PASS
Ryzyka: helperowy preview nadal pokazuje timeline i nadal moze sugerowac bogatsza analityke niz finalny zapis; to jest osobny follow-up z findingu #3.
Follow-up: osobny task na zrownanie preview helpera z finalnym persistence kontraktem oraz osobny task na stale/zgadywane probki helpera.
