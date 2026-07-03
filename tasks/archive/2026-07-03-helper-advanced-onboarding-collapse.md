# Archived Task

Closed At: 2026-07-03T07:28:06.854Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-helper-advanced-onboarding-collapse
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Zrealizować task: helper-advanced-onboarding-collapse.

## Kryteria sukcesu
- Task ma dowód PASS.

## Priorytet / Blocker
Największy blocker teraz: Zrealizować task: helper-advanced-onboarding-collapse.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: helper onboarding UI
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- tasks/archive/**
- src/components/TrackerPanels.tsx
- src/components/TrackerWorkspace.tsx
Kontrakty do przeczytania: AGENTS.md oraz tylko potrzebne docs dla tego taska
Pliki zakazane: wszystko poza allowlistą
Czego nie ruszać: backend, convex, testy i pliki poza zakresem

## Zakres
Moduł: helper onboarding UI
Pliki: tasks/todo.md, src/components/TrackerPanels.tsx, src/components/TrackerWorkspace.tsx

## Reprodukcja / dowód problemu
- Tryb zaawansowany pokazuje od razu status, ostatnia aktywnosc, sugestie, historie, privacy, pauzy i reguly.
- Uzytkownik poprosil: "w zawnasowanym niktore rzeczy mozesz ziwnac na poczatek".

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
Root cause: onboarding helpera miesza pierwszy start z ustawieniami zaawansowanymi, przez co nowy uzytkownik widzi za duzo opcji zanim w ogole sprawdzi, czy helper dziala.
Dowód: aktualny `DesktopHelperPanel` renderuje historie, prywatne domeny i reguly bez zadnego disclosure.
Aktualny flow: wejscie w tryb zaawansowany -> widoczne sa od razu wszystkie sekcje helpera.

## Granice
Moduły dotknięte: `TrackerWorkspace`, `DesktopHelperPanel`
Kontrakty dotknięte: tylko frontendowy kontrakt widocznosci sekcji helpera.
Poza zakresem: backend ingestu helpera, generowanie klucza, logika privacy, logika reguł i deploy.

## Kontrakt
INPUT: uzytkownik wlacza tryb zaawansowany helpera.
SUCCESS: na starcie widzi tylko podstawowe uruchomienie helpera i status, a sekcje privacy / historię / reguly moze rozwinac recznie.
ERRORS: brak toggle, ukrycie krytycznych akcji startowych albo diff poza scope.
STATUSES: PASS / FAIL.
SIDE EFFECTS: tylko zmiany w renderowaniu UI.
LOGS: komendy weryfikacyjne.
TESTS: `npm run gate:local`
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: status helpera nadal musi renderowac sensowne fallbacki.
Invalid schema: nie dotyczy.
Duplicate request: toggle ma byc lokalny i idempotentny.
Concurrent request: nie dotyczy.
Partial write: nie zostawiać pustego sukcesu.
Worker crash: nie dotyczy.
Retry loop: nie dotyczy.
Provider unavailable: nie dotyczy.

## Guard Scope
REQUIRED GUARDS:
- trzymac sie allowlisty.
- nie ruszac logiki helpera poza widocznoscia sekcji.
- uruchomic `npm run gate:local`.

NICE_TO_HAVE GUARDS:
- pomysły poza zakresem zapisać do ParkingLot.md.

OVERBUILD GUARDS:
- nie tworzyć nowego subsystemu bez osobnego taska.

ParkingLot.md updated:
NOT_NEEDED

## Runtime guards
State machine: tryb prosty i zaawansowany pozostaja bez zmian; dochodzi tylko lokalny disclosure dla sekcji helpera.
Error classification: nie dotyczy poza zachowaniem dotychczasowych fallbackow tekstowych.
Idempotency: wielokrotne rozwijanie / zwijanie nie moze zmieniac danych helpera.
Single-flight: nie dotyczy.
Worker lock: nie dotyczy.
Circuit breaker: nie dotyczy.
Backpressure: nie dotyczy.
UI truth: podstawowe akcje helpera musza zostac widoczne bez rozwijania ustawien.
Observability: `gate:local` i wizualny diff komponentu.

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
- [ ] Zawęzić onboarding helpera do podstawowego startu i statusu.
- [ ] Schować historie, privacy i reguly pod jednym togglem.
- [ ] Uruchomic `npm run gate:local`.

## Weryfikacja
Komendy:
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
Co zmieniono: w `DesktopHelperPanel` zostawiono na starcie status, klucz, starter i szybki start, a historie, prywatne domeny, tracking controls i reguly schowano pod przyciskiem `Pokaz ustawienia zaawansowane`.
Jak sprawdzono: `npm run gate:local`
PASS / FAIL: PASS
Ryzyka: `src/components/TrackerPanels.tsx` pozostaje duzym plikiem, ale ten task nie dokladal nowego subsystemu ani backendu.
Follow-up: osobny release-build task, jesli te lokalne zmiany maja trafic na produkcje.
