# Archived Task

Closed At: 2026-07-03T13:55:01.089Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-manual-cross-midnight-capability
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Ręczny add/edit ma realnie zapisywać zakres przez północ jako dwa wpisy dzienne, zamiast odrzucać taki przypadek.

## Kryteria sukcesu
- Manual add i edit zapisują zakres przez północ jako dwa wpisy

## Priorytet / Blocker
Największy blocker teraz: Ręczny add/edit ma realnie zapisywać zakres przez północ jako dwa wpisy dzienne, zamiast odrzucać taki przypadek.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: manual-cross-midnight-capability
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- convex/tracker.ts
- convex/trackerModel.ts
- src/App.tsx
- src/components/SessionDialogs.tsx
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: manual-cross-midnight-capability
Pliki: tasks/todo.md, convex/tracker.ts, convex/trackerModel.ts, src/App.tsx, src/components/SessionDialogs.tsx, tests/app.test.tsx

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
Root cause: manual add i edit zakładały jeden rekord `sessions` na jeden draft formularza. `buildSessionRecord()` interpretował `date + start + stop` wyłącznie w tej samej dobie, więc zakres przez północ był odrzucany zamiast mapowany na dwa dzienne wpisy.
Dowód: `addManualSession` i `updateSession` w cloud oraz ich lokalne odpowiedniki w `src/App.tsx` używały bezpośrednio `buildSessionRecord()`, który dla `stop <= start` rzucał błędem zamiast zwracać zapisany wynik.
Aktualny flow: użytkownik wpisuje `23:50 -> 00:20` -> runtime odrzuca wpis mimo poprawnej intencji użytkownika, a jedynym obejściem jest ręczne rozbijanie na dwa osobne formularze.

## Granice
Moduły dotknięte: `convex/trackerModel.ts`, `convex/tracker.ts`, lokalny odpowiednik w `src/App.tsx`, copy formularza i testy.
Kontrakty dotknięte: manual add/edit może teraz zapisać zakres przez północ jako dwa dzienne wpisy; równe `start` i `stop` nadal są błędem.
Poza zakresem: grupowanie takich dwóch wpisów jako jednej „sesji logicznej” przy późniejszej wspólnej edycji albo usuwaniu.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: manual add i edit zamieniają zakres przez północ na dwa rekordy dzienne zarówno w cloud, jak i local; UI mówi o tym wprost.
ERRORS: runtime dalej odrzuca taki przypadek albo zapisuje jeden rekord, który ukrywa przejście przez północ.
STATUSES: PASS / FAIL.
SIDE EFFECTS: `updateSession` może oprócz patcha istniejącego wpisu dołożyć drugi rekord dla następnego dnia.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`, `npm run gate:local`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: nie zgadywać, użyć ESCALATION.
Invalid schema: nie dotyczy, chyba że task dotyka danych.
Duplicate request: sprawdzić idempotencję, jeśli task ma side effecty.
Concurrent request: cloud/local muszą używać tego samego helpera semantycznego, inaczej capability rozjedzie się między trybami.
Partial write: przy edycji zakresu przez północ pierwszy rekord nie może zostać zapisany bez dołożenia drugiego dnia.
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
State machine: `same-day manual draft -> 1 record`; `cross-midnight manual draft -> 2 records`; `equal start/stop -> validation error`.
Error classification: tylko `start === stop` dalej failuje jako błędny zakres; `stop < start` oznacza przejście przez północ, nie walidacyjny error.
Idempotency: add/update nie mają retry i powinny deterministycznie generować ten sam układ rekordów dla tych samych danych wejściowych.
Single-flight: bez zmian, używa istniejących handlerów akcji.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: formularz mówi już, że zapis utworzy dwa osobne wpisy dla kolejnych dni.
Observability: test helpera splitu, test copy i pełny `gate:local`.

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
Co zmieniono: dodałem helper `buildManualSessionRecords()`, który traktuje `stop < start` jako zakres przez północ i rozbija manualny draft na dwa dzienne wpisy. Cloud `addManualSession` i `updateSession` oraz ich lokalne odpowiedniki używają teraz tego samego helpera. Formularz mówi wprost o automatycznym splicie na dwa wpisy, a testy pilnują zarówno splitu, jak i walidacji `start === stop`.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run gate:local`
PASS / FAIL: PASS
Ryzyka: dwa wpisy utworzone z jednego manualnego zakresu nie mają osobnego `groupId`, więc późniejsza wspólna edycja takiej „sesji logicznej” nadal nie istnieje jako osobny feature.
Follow-up: osobny task tylko jeśli chcesz modelować takie dwudniowe wpisy jako jedną encję do wspólnej edycji/usuwania.
