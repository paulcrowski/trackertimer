# AGENTS.md

## Entry Point

To jest jedyny always-on entrypoint workflow.

Pracuj outcome-first:
1. oczekiwany wynik,
2. kryteria sukcesu,
3. ograniczenia,
4. dostępne dowody,
5. najmniejsza bezpieczna zmiana.

Nie zaczynaj od kodowania. Jeśli brakuje danych do bezpiecznej zmiany, użyj ESCALATION.
Repo trzyma procedurę. Prompt trzyma outcome.

## Tryby pracy

`MINIMAL_FIX` - mały bugfix, max 3 pliki, max 50 LOC.
`CONTENT_FIX` - copy albo mały UI polish bez runtime/danych, max 3 pliki, max 80 LOC.
`RUNTIME_FIX` - API, worker, parser, kolejka, cache, provider, UI status.
`STRUCTURE_FIX` - granice modułów, zależności, duży plik, god file.
`FEATURE` - nowa funkcja.
`AUDIT` - tylko diagnoza, bez kodowania.

Nie stosuj pełnej procedury do drobnego fixa bez runtime/danych/krytycznego flow.
`CONTENT_FIX` nie dotyka API, auth, DB, workerów, providerów, security ani źródła prawdy.
Użytkownik nie wypełnia taska ręcznie. Agent wybiera najmniejszy bezpieczny tryb i uruchamia `task:new`.

## Co Czytać On-Demand

Zawsze startuj od tego pliku.

Czytaj dodatkowe źródła tylko wtedy, gdy task tego wymaga:
- `docs/AGENT_READY_WORKFLOW.md` dla projektowania taska.
- `docs/ARCHITECTURE_GUARDS.md` dla runtime/API/worker/UI/provider.
- `docs/CODE_STRUCTURE_GUARDS.md` dla dużych plików, granic modułów i zależności.
- `docs/CONTEXT_BUDGET_GUARD.md` dla długich albo drogich sesji.
- `docs/CONTRACTS.md` i `docs/MODULE_MAP.md` tylko gdy zmieniasz kontrakt albo kilka modułów.
- `AGENT_DEV_POLICY.md` jako reference/on-demand dla maintainerów workflow i rzadszych edge case'ów.
- `README.md` jako onboarding repo, nie jako domyślny kontrakt taska.

## Escalation

Jeśli brakuje danych do bezpiecznej zmiany:
- nie koduj,
- wypisz brakujące dowody,
- zaproponuj najmniejszy audit albo test reprodukcyjny,
- oznacz status jako `BLOCKED_BY_MISSING_EVIDENCE`.

## Klasyfikacja

`REQUIRED` - trzeba zrobić teraz.
`NICE_TO_HAVE` - dobre, ale nie teraz.
`OVERBUILD` - nie robić.

Jeśli zmiana jest `NICE_TO_HAVE` albo `OVERBUILD`, nie koduj jej. Zapisz ją do `ParkingLot.md`.

## Priorytet / Blocker

Przed kolejnym slicem wskaż:
- największy blocker,
- dowód blockera,
- czy aktualny task go rusza,
- jeśli nie: `BLOCKED_EXTERNAL_STATE`, `REQUIRED_PREREQUISITE`, `RISKY_WITHOUT_AUDIT` albo `SMALL_FIX_UNBLOCKING_MAIN_WORK`,
- warunek powrotu do blockera.

Nie rób dwóch kolejnych tasków z `Czy ten task rusza blocker: NIE`.

## Scope Lock

Każdy task musi wskazać:
- `Tryb zmiany: code-change / audit-only / release-build`
- `Dozwolone pliki do zmiany`

Zasady:
- `code-change`: wolno dotknąć tylko allowlisty.
- `audit-only`: nie wolno zmienić żadnego pliku.
- `release-build`: artefakty tylko, jeśli są jawnie w allowliście.
- `artifacts/**` jest zablokowane poza `release-build`.
- unexpected change = STOP i popraw scope.

## Failure-First

Dla runtime, danych, API, workerów, parserów, providerów, UI statusu i side-effectów nie wystarczy happy path.

Przed kodowaniem wskaż:
1. root cause,
2. kontrakt,
3. failure modes,
4. state machine / statusy,
5. plan testów,
6. dowód PASS / FAIL.

Jeśli nie da się opisać końca flow, retry policy, idempotencji albo źródła prawdy, nie koduj. Użyj `docs/ARCHITECTURE_GUARDS.md`.

## Zasady Pracy

1. Jedna zmiana = jeden commit.
2. Jeden task = jeden problem.
3. Każdy task ma mieć PASS / FAIL.
4. Nie ma DONE bez dowodu.
5. Nie refaktoruj przy okazji.
6. Nie dodawaj funkcji poza zakresem.
7. Nie twórz nowego subsystemu bez zgody.
8. Nie dotykaj plików poza zakresem.
9. Jeśli task wymaga >20 plików albo >250 LOC diffu, przerwij i zrób re-plan.
10. Nie ładuj wszystkich guardów do każdego promptu.

## Minimalny Format Przed Kodowaniem

`MINIMAL_FIX`
- tryb pracy
- root cause
- dowód
- minimalny fix
- test

`CONTENT_FIX`
- tryb pracy
- root cause
- dowód
- minimalny fix
- test albo visual/render proof

`RUNTIME_FIX` / `STRUCTURE_FIX` / `FEATURE`
- tryb pracy
- Priorytet / Blocker
- diagnoza
- granice
- kontrakt
- failure modes
- Guard Scope
- plan testów
- plan zmiany

`AUDIT`
- fakty
- dowody
- ryzyka
- plan naprawczy
- zero kodu

## Zakazy

- happy-path only
- silent fallback
- empty success
- infinite retry
- `any` / `null` jako wynik biznesowy
- mieszanie fetch/parse/validate/state/UI
- retry dla parse/schema/validation/business errors
- zapisywanie niezweryfikowanych danych jako faktu
- przepisywanie całego pliku bez potrzeby
- duży refactor bez osobnego taska
- powiększanie god file bez planu
- odwracanie kierunku zależności
- obchodzenie kontraktów modułów
- zgadywanie bez dowodu

## Raport Po Zmianie

Pokaż:

Zrobione:
Pliki:
Dlaczego:
Jak sprawdzono:
Wynik: PASS / FAIL
Czego nie ruszałem:
Ryzyka:
Follow-up / Parking Lot:

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
