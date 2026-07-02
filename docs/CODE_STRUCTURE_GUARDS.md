# CODE_STRUCTURE_GUARDS.md

Ten dokument obowiązuje przy każdym tasku, który:
- dodaje nową logikę,
- zmienia istniejący moduł,
- dotyka pliku powyżej 300 LOC,
- dotyka core/runtime/business logic,
- wymaga zmian w kilku warstwach systemu.

Celem jest ograniczenie god files, ukrytych zależności, pajęczyny importów i zmian, które wymagają czytania całego repo.

## 1. File / Module Size Guard

Duży plik jest sygnałem ryzyka architektonicznego.

Przed dopisaniem kodu do dużego pliku agent musi sprawdzić:
- czy plik nie pełni zbyt wielu ról,
- czy miesza fetch / parse / validate / state / UI / DB,
- czy istnieje naturalna granica modułu,
- czy można dodać kod do istniejącej właściwej warstwy zamiast powiększać god file.

Limity:
>300 LOC - ostrzeżenie.
>500 LOC - nie dopisuj nowej logiki bez planu rozbicia.
>800 LOC - ryzyko architektoniczne.
>1000 LOC - zakaz dokładania feature’ów bez GOD_FILE_CHECK.

Nie rozbijaj pliku dla samego rozbijania.
Rozbijaj tylko wtedy, gdy istnieje realna granica odpowiedzialności.

Dozwolone kierunki wydzielenia:
- typy / kontrakty,
- parser,
- validator,
- state transitions,
- repository,
- adapter providera,
- UI mapping,
- test helpers,
- telemetry mapping,
- error mapping.

Zakaz:
- helperów użytych raz,
- losowych plików bez granicy domenowej,
- przenoszenia chaosu z jednego pliku do pięciu,
- refaktoru przy okazji,
- mieszania refaktoru i feature w jednym diffie.

## 2. Dependency Direction Guard

Zależności mają iść od szczegółów do polityki, nie odwrotnie.

Core / business logic to centrum systemu.
UI, baza, framework, provider i storage to szczegóły.

Zakaz:
- core importuje UI,
- core importuje DB adapter,
- core importuje framework-specific runtime,
- parser zapisuje do DB,
- fetcher zmienia status UI,
- repository podejmuje decyzje biznesowe,
- UI liczy reguły domenowe,
- adapter providera zna logikę scoringu.

Dozwolone:
- UI używa kontraktu,
- adapter używa kontraktu,
- core definiuje reguły,
- repository zapisuje wynik, ale nie decyduje,
- parser zwraca wynik parsowania, ale nie zapisuje do storage,
- validator zwraca status walidacji, ale nie steruje UI.

Business Logic może definiować kontrakty.
Adaptery mogą implementować kontrakty.
Core nie może zależeć od adapterów.

## 3. Change Isolation Guard

Przed zmianą agent musi odpowiedzieć:
- ile modułów dotyka zmiana?
- czy zmiana biznesowa wymaga zmian w wielu warstwach?
- czy to oznacza złą granicę?
- czy da się ograniczyć zmianę do jednego kontraktu?
- czy da się najpierw dodać test/adapter zamiast zmieniać core?

Jeśli jedna mała zmiana wymaga edycji 5+ miejsc, agent ma zatrzymać pracę i zgłosić:

CHANGE_ISOLATION_WARNING:
- które moduły trzeba dotknąć,
- dlaczego,
- czy to naturalne,
- czy granice modułów są złe,
- jaki jest minimalny wariant.

## 4. Production Readiness Guard

Funkcja nie jest gotowa, jeśli działa tylko na happy path.

Każda nowa funkcja lub flow musi mieć:
- timeout,
- status błędu,
- log,
- test błędu,
- rollback albo feature flag,
- brak kłamstwa w UI,
- jasny terminal state.

Zakaz:
- pending bez końca,
- retry bez limitu,
- brak statusu błędu,
- UI pokazuje wynik bez weryfikacji,
- fallback udaje success,
- system zapisuje niepełny wynik jako gotowy.

## 5. God File Response Protocol

Jeśli agent trafia na plik >500 LOC, przed kodowaniem musi napisać:

GOD_FILE_CHECK:

Plik:
LOC:
Obecne odpowiedzialności:
Czy task dokłada nową odpowiedzialność:
Minimalny fix bez rozbicia:
Małe wydzielenie odpowiedzialności:
Ryzyko minimalnego fixu:
Ryzyko wydzielenia:
Rekomendacja:

Jeśli plik ma >800 LOC, agent nie może dopisać nowej funkcji bez jawnej zgody.

Jeśli plik ma >1000 LOC, agent może robić tylko:
- bugfix lokalny,
- test,
- wydzielenie odpowiedzialności,
- dokumentację granicy,
chyba że tasks/todo.md zawiera GOD_FILE_CHECK i jasne uzasadnienie.

## 6. Import Boundary Check

Przed commitem agent sprawdza:
- czy nowy import nie odwraca zależności,
- czy business logic nie importuje UI/DB/frameworka,
- czy nie powstał cykl,
- czy adapter nie przecieka do core,
- czy test nie wymusza importowania pół repo.
