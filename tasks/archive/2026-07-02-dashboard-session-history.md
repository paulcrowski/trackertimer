# Archived Task

Closed At: 2026-07-02T20:19:51.045Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-dashboard-session-history
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
FEATURE

Uzasadnienie trybu:
Task utworzony przez task lifecycle.

## Cel / Outcome
Dodac do worktimera dashboard z podsumowaniem i historie sesji oparta o realne dane Convex, tak aby zalogowany uzytkownik widzial ostatnie sesje i agregaty pracy bez psucia timera, auth i PWA.

## Kryteria sukcesu
- Aplikacja pokazuje dashboard z agregatami i liste historii sesji dla zalogowanego uzytkownika

## Priorytet / Blocker
Największy blocker teraz: Dodac do worktimera dashboard z podsumowaniem i historie sesji oparta o realne dane Convex, tak aby zalogowany uzytkownik widzial ostatnie sesje i agregaty pracy bez psucia timera, auth i PWA.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: tracker+dashboard
Tryb zmiany: code-change
Maksymalny zakres plików: allowlista z taska
Dozwolone pliki do zmiany:
- tasks/todo.md
- src/App.tsx
- src/index.css
- src/components/TrackerWorkspace.tsx
- src/components/TrackerPanels.tsx
- src/components/SessionsPanel.tsx
- src/components/ActivityCharts.tsx
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
Moduł: tracker+dashboard
Pliki: tasks/todo.md, src/App.tsx, src/index.css, src/components/TrackerWorkspace.tsx, src/components/TrackerPanels.tsx, src/components/SessionsPanel.tsx, src/components/ActivityCharts.tsx, src/lib/tracker.ts, src/lib/trackerTypes.ts, convex/tracker.ts, convex/trackerModel.ts, tests/app.test.tsx

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
Root cause: aplikacja ma licznik i surowe sesje z Convex, ale warstwa prezentacji nie zamienia ich w prawdziwy dashboard ani w czytelną historię pracy. `bootstrap` zwraca tylko podstawowe `summary/charts`, a UI renderuje cztery metryki i płaską tabelę wpisów.
Dowód: `convex/tracker.ts` zwraca `summary`, `charts` i `sessions` bez pochodnego modelu dashboardu lub grup historii; `src/components/TrackerPanels.tsx` pokazuje tylko 4 statystyki; `src/components/SessionsPanel.tsx` renderuje pojedynczą tabelę bez grupowania po dniach i bez filtrów.
Aktualny flow: Convex `bootstrap` pobiera wszystkie sesje i preferencje -> frontend controller dogrywa tylko live elapsed time dla aktywnej sesji -> workspace pokazuje timer, pomodoro, 4 kafle, wykresy i tabelę historii.

## Granice
Moduły dotknięte: tracker+dashboard
Kontrakty dotknięte: `TrackerBootstrap` oraz pochodne helpery modelu sesji po stronie Convex i React.
Poza zakresem: wszystko poza allowlistą.

## Kontrakt
INPUT: polecenie użytkownika i pliki z allowlisty.
SUCCESS: `bootstrap` zwraca dane dashboardu i historii wyliczone z tych samych sesji, UI renderuje je bez psucia istniejącego start/stop/manual edit/delete/export.
ERRORS: brak dowodu, zmiana poza scope albo failujące gate'y.
STATUSES: PASS / FAIL.
SIDE EFFECTS: tylko zmiany w plikach z allowlisty.
LOGS: komendy weryfikacyjne.
TESTS: `npm test`, `npm run typecheck`, `npm run build`.
DONE: review ma konkretny wynik.

## Failure modes
Timeout: przerwać i pokazać ostatni bezpieczny stan.
Null/missing data: dashboard i historia muszą mieć bezpieczne puste stany przy zerowej liczbie sesji.
Invalid schema: nie zmieniamy tabel; ryzyko dotyczy tylko złamania typu `TrackerBootstrap`.
Duplicate request: sprawdzić idempotencję, jeśli task ma side effecty.
Concurrent request: aktywna sesja dalej może dopisywać live elapsed time; dashboard nie może podwójnie liczyć już zapisanych sesji.
Partial write: nie zostawiać połowicznego kontraktu, gdzie backend zwraca nowe pola, a UI ich nie typuje lub odwrotnie.
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
State machine: `bootstrap` pozostaje read-only; aktywna sesja dalej liczy live elapsed time tylko w controllerze, zapisane sesje pozostają źródłem prawdy dla dashboardu i historii.
Error classification: błędy mutacji start/stop/save/edit/delete pozostają w `App.tsx`; ten task nie dodaje nowego runtime error path.
Idempotency: helpery dashboardu i historii muszą być czysto deterministyczne dla tej samej listy sesji.
Single-flight: bez zmian; brak nowych mutacji.
Worker lock: do uzupełnienia, jeśli dotyczy.
Circuit breaker: do uzupełnienia, jeśli dotyczy.
Backpressure: do uzupełnienia, jeśli dotyczy.
UI truth: filtrowanie historii działa tylko na danych z `bootstrap`; nie tworzymy lokalnych duplikatów ani osobnego store.
Observability: komendy weryfikacyjne jako dowód.

## Code Structure Guard
Czy dotykamy pliku >300 LOC?
TAK

Jeśli TAK:
Plik: `src/lib/tracker.ts`, `src/components/TrackerPanels.tsx`, `src/index.css`
LOC: ok. 472 / 339 / 724
Dlaczego zmiana trafia tutaj: to już istniejące seam-y controllera, paneli dashboardu i globalnych styli aplikacji.
Czy plik ma wiele odpowiedzialności: tak, ale zmiana pozostaje w istniejącej odpowiedzialności trackera i layoutu.
Minimalny fix: dołożyć pochodne helpery/dashboard render zamiast tworzyć nowy subsystem albo nowy store.
Czy potrzebne wydzielenie odpowiedzialności: nie w tym tasku, bo byłby to osobny `STRUCTURE_FIX`.
Ryzyko: dalsze puchnięcie plików; kontrolować zakresem i nie mieszać auth/PWA/pomodoro.

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
Plik: `src/index.css`
LOC: ok. 724
Obecne odpowiedzialności: globalny shell, auth screen, timer, panele, tabele, modale i responsive rules.
Czy task dokłada nową odpowiedzialność: nie, nadal tylko styluje ekran trackera.
Minimalny fix bez rozbicia: dopisać sekcje dashboardu i historii przy zachowaniu istniejącego token systemu.
Małe wydzielenie odpowiedzialności: potencjalnie później rozbić style na moduły `dashboard/history/dialogs`.
Ryzyko minimalnego fixu: kolejny wzrost LOC.
Ryzyko wydzielenia: większy diff niż potrzeba dla tego feature.
Rekomendacja: zrobić minimalny feature teraz, rozbicie CSS zostawić na osobny task.

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
- [x] Rozszerzyć model Convex o pochodne dane dashboardu i grupy historii bez zmiany tabel.
- [x] Zaktualizować typy i render dashboardu/historii po stronie React.
- [x] Uruchomić weryfikację.

## Weryfikacja
Komendy:
- `npm test`
- `npm run typecheck`
- `npm run build`
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
Co zmieniono: `bootstrap` zwraca teraz pochodne `dashboard` i `history`, sesje sa sortowane po realnym czasie sesji, dashboard pokazuje serie / srednia / najmocniejszy dzien / dominujaca kategorie / heatmap 14 dni, a historia sesji jest grupowana po dniach z wyszukiwaniem i filtrem kategorii.
Jak sprawdzono: `npm test`, `npm run typecheck`, `npm run build`.
PASS / FAIL: PASS
Ryzyka: brak browser smoke testu; layout i interakcje sa sprawdzone przez test/build/typecheck, ale nie bylo jeszcze recznego przejscia po lokalnym UI.
Follow-up: osobny `STRUCTURE_FIX` moze rozbic rozrosniety `src/index.css` i czesc helperow dashboardu, jesli feature bedzie dalej rosl.
