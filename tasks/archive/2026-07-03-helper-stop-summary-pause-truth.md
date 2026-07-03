# Archived Task

Closed At: 2026-07-03T15:13:08.158Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-helper-stop-summary-pause-truth
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
RUNTIME_FIX

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Helper summary przy STOP ma odejmować realne pauzy sesji, zamiast liczyć ciągły kontekst przez pauzy.

## Kryteria sukcesu
- Helper summary nie zawyża trackedSeconds przez pauseRanges i pozostaje spójny z czasem timera.

## Priorytet / Blocker
Największy blocker teraz: Helper summary przy STOP ma odejmować realne pauzy sesji, zamiast liczyć ciągły kontekst przez pauzy.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: helper-stop-summary-pause-truth
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/lib/tracker.ts
- tests/app.test.tsx
- tasks/archive/**
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: helper-stop-summary-pause-truth
Pliki: tasks/todo.md, src/lib/tracker.ts, tests/app.test.tsx

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
Root cause: `buildStopFocusSummary()` liczył czas bloków helpera jako ciągłe odcinki między sample, ale ignorował `activeSession.pauseRanges`. Przy pauzie w środku sesji helper summary mógł pokazać więcej `trackedSeconds` niż timer realnie naliczył.
Dowód: runtime summary używał tylko `sessionStart`, `confirmedSessionEnd` i helper sample timestamps. Nawet po wprowadzeniu `pauseRanges` do aktywnej sesji summary nie odejmował overlapów pauz od bloków helpera. Dla sesji `100_000 -> 220_000` z pauzą `130_000 -> 160_000` i blokami `100_000 -> 180_000`, `180_000 -> 220_000` stary summary dawał 120 s zamiast 90 s.
Aktualny flow: helper sample budują bloki kontekstu w oknie sesji, a każdy blok odejmuje overlap `pauseRanges`, więc summary jest liczone z realnie aktywnych fragmentów sesji.

## Granice
Moduły dotknięte: helper-stop-summary-pause-truth
Kontrakty dotknięte: `buildStopFocusSummary` w `src/lib/tracker.ts`, testy helper summary w `tests/app.test.tsx`.
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: aktywna sesja z `pauseRanges`, helper activities i helper status.
SUCCESS: helper summary odejmuje realne overlapy pauz z każdego bloku i nie zawyża `trackedSeconds` względem timera.
ERRORS: summary nie może liczyć czasu przez środek pauzy ani udawać spójności z timerem, gdy helper preview ma większy czas niż aktywna sesja.
STATUSES: PASS / FAIL.
SIDE EFFECTS: brak zmian w persistence ani UI copy; tylko korekta wyliczenia helper summary.
LOGS: `npm test`, `npm run typecheck`, `npm run gate:local`.
TESTS: regresja dla pauzy w środku sesji i pełny lokalny gate.
DONE: review ma konkretny wynik PASS i archive zachowuje dowód.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: brak `pauseRanges` zachowuje obecne liczenie bez odjęć; task nie zgaduje położenia historycznych pauz z samego `pausedSeconds`.
Invalid schema: helper summary opiera się na istniejącym shape `PauseRange`; task nie dodaje nowego schematu.
Duplicate request: nie dotyczy, summary jest czysto pochodne.
Concurrent request: task nie zmienia współbieżności; tylko poprawia kontrakt liczenia.
Partial write: brak side-effectów; najważniejsze jest, żeby preview nie raportował pustego sukcesu z zawyżonym czasem.
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
State machine: `session active ranges + helper sample -> helper blocks -> subtract pause overlaps -> summary`.
Error classification: brak timeline pauz w legacy danych = brak dokładniejszego odejmowania, nie sztuczna precyzja.
Idempotency: helper summary pozostaje czysto pochodne i deterministyczne dla tych samych wejść.
Single-flight: nie dotyczy, brak fetch/job orchestration.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: helper preview nie może pokazywać więcej czasu kontekstu niż timer uznaje za aktywny po odjęciu pauz.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/lib/tracker.ts`, `tests/app.test.tsx`
LOC: ~1765, ~1130
Dlaczego zmiana trafia tutaj: helper summary seam i jego kontrakt testowy żyją już tylko w tych plikach.
Czy plik ma wiele odpowiedzialności: tak.
Minimalny fix: dodać odejmowanie overlapów pauz bez przebudowy summary do osobnego modułu.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku.
Ryzyko: dalszy mały wzrost dużych plików, ale zakres pozostaje jeden kontrakt.

## GOD_FILE_CHECK
Wymagane, jeśli plik >500 LOC.

Plik: `src/lib/tracker.ts`, `tests/app.test.tsx`
LOC: ~1765, ~1130
Obecne odpowiedzialności: helpery trackera, source-of-truth aktywnej sesji, controller, testy kontraktowe i UI proofy.
Czy task dokłada nową odpowiedzialność: nie, tylko doprecyzowuje istniejące liczenie helper summary.
Minimalny fix bez rozbicia: mały helper liczący overlapy pauz i regresja testowa.
Małe wydzielenie odpowiedzialności: odłożone, bo to byłby osobny `STRUCTURE_FIX`.
Ryzyko minimalnego fixu: niskie.
Ryzyko wydzielenia: wyjście poza scope.
Rekomendacja: minimalny fix teraz, bez rozbijania modułów.

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
Co zmieniono: `buildStopFocusSummary()` odejmuje teraz overlapy `pauseRanges` z każdego bloku helpera, więc `trackedSeconds` i czasy bloków nie przechodzą przez środek pauzy; dodano regresję dla pauzy w środku sesji.
Jak sprawdzono: `npm test` PASS, `npm run typecheck` PASS, `npm run gate:local` PASS.
PASS / FAIL: PASS
Ryzyka: dla legacy aktywnych sesji bez timeline pauz summary nadal nie odtworzy dokładnego rozkładu z samego `pausedSeconds`; to ograniczenie danych wejściowych, nie błąd nowego kontraktu.
Follow-up: osobny task tylko jeśli chcesz pokazywać w UI jawny „coverage vs paused time” zamiast samego poprawnego helper preview.
