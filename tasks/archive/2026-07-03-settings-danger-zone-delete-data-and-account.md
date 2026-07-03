# Archived Task

Closed At: 2026-07-03T09:29:09.926Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-settings-danger-zone-delete-data-and-account
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Dodac w settingsach danger zone z mozliwoscia usuniecia wszystkich danych użytkownika z Convexa oraz usuniecia konta Google-backed w worktimerze.

## Kryteria sukcesu
- Zalogowany użytkownik może z poziomu settings uruchomić usunięcie wszystkich swoich danych albo całego konta

## Priorytet / Blocker
Największy blocker teraz: Dodac w settingsach danger zone z mozliwoscia usuniecia wszystkich danych użytkownika z Convexa oraz usuniecia konta Google-backed w worktimerze.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: tracker
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- convex/tracker.ts
- src/App.tsx
- src/components/TrackerWorkspace.tsx
- src/components/SessionDialogs.tsx
- src/lib/tracker.ts
- src/lib/trackerTypes.ts
- src/index.css
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: tracker
Pliki: tasks/todo.md, convex/tracker.ts, src/App.tsx, src/components/TrackerWorkspace.tsx, src/components/SessionDialogs.tsx, src/lib/tracker.ts, src/lib/trackerTypes.ts, src/index.css, tests/app.test.tsx

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
Root cause: app byla cloud-first, ale nie miala zadnego user-facing seam do skasowania danych trackera ani konta. Backend mial tylko operacje na pojedynczych sesjach/regulach, a header/workspace nie mial settings dialogu ani flow potwierdzenia.
Dowód: `convex/tracker.ts` przed zmianą eksportował tylko mutacje sesji/reguł/preferencji; `src/App.tsx` i `src/components/TrackerWorkspace.tsx` nie miały mutacji ani UI dla account/data deletion.
Aktualny flow: header otwiera settings dialog, użytkownik wpisuje frazę potwierdzającą, frontend wywołuje dedykowaną mutację Convex, po delete-data czyści lokalny snapshot aktywnej sesji, a po delete-account dodatkowo czyści lokalne tokeny auth i przeładowuje appkę.

## Granice
Moduły dotknięte: tracker
Kontrakty dotknięte: publiczne mutacje `tracker.deleteAllUserData` i `tracker.deleteUserAccount`, header/workspace settings flow oraz render dialogu potwierdzenia.
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
State machine: `idle -> settings-open -> confirming -> deleting-data|deleting-account -> success-reload|success-alert|error-banner`.
Error classification: backend ownership/auth/walidacja zostają non-retryable przez `ConvexError`; frontend nie ukrywa błędu i wpina go do istniejącego error bannera.
Idempotency: kolejne delete requesty po wyczyszczeniu danych są bezpieczne, bo batch delete dochodzi do pustych tabel i kończy się bez pustego sukcesu biznesowego.
Single-flight: UI blokuje równoległe delete actions przez lokalny `dangerBusy`.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: użytkownik widzi jawny dialog settings z frazą potwierdzenia; delete-account kończy się local cleanup + reload, a delete-data daje jawny alert po sukcesie zamiast cichego resetu.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `convex/tracker.ts`, `src/components/TrackerWorkspace.tsx`
LOC: >300
Dlaczego zmiana trafia tutaj: to istniejące seamy dla mutacji trackera i głównego workspace UI.
Czy plik ma wiele odpowiedzialności: tak
Minimalny fix: dołożono tylko mutacje delete oraz prosty modal settings bez nowego subsystemu.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: kolejne feature slicy w tych plikach będą coraz droższe.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `convex/tracker.ts`
LOC: >500
Obecne odpowiedzialności: bootstrap, sesje, preferencje, helper ingest, reguły i teraz delete flows.
Czy task dokłada nową odpowiedzialność: tak, ale w naturalnym seamie account/data mutations.
Minimalny fix bez rozbicia: tak
Małe wydzielenie odpowiedzialności: odłożone
Ryzyko minimalnego fixu: dalsze puchnięcie backendowego god file.
Ryzyko wydzielenia: większy diff i wyjście poza scope.
Rekomendacja: osobny `STRUCTURE_FIX`, jeśli pojawi się kolejny backend feature w trackerze.

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
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run gate:local`
Expected result: PASS.

## Definition of Done
- [x] test PASS
- [x] build PASS albo NOT_NEEDED z uzasadnieniem
- [ ] brak ERROR w logach
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
Co zmieniono: dodano backendowe mutacje kasowania wszystkich danych użytkownika oraz całego konta, przycisk settings w headerze i modal z frazą potwierdzenia dla delete-data/delete-account.
Jak sprawdzono: `npm run typecheck`, `npm test`, `npm run build`; `npm run gate:local` wymaga standardowego commitu, bo `check:diff-size` mierzy diff względem `HEAD`.
PASS / FAIL: PASS
Ryzyka: delete-account czyści tokeny po stronie klienta przez lokalny cleanup nazwanych kluczy auth; jeśli Convex Auth zmieni naming storage keys, ten seam trzeba będzie odświeżyć.
Follow-up: jeśli wróci temat prywatności lokalnej, zrobić osobny `AUDIT`/`FEATURE` dla prawdziwego local-only mode zamiast dokręcać to do cloud-first delete flow.
