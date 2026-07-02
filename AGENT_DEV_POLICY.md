# AGENT_DEV_POLICY.md

Dokument referencyjny workflow. Nie jest always-on entrypointem; czytaj go tylko wtedy, gdy `AGENTS.md` albo aktualny task wyraźnie tego wymaga.

## TL;DR

1. Outcome first, process only as needed.
2. Najpierw root cause, potem kod.
3. Nie zaczynaj od kodowania.
4. Sprawdź realne pliki, logi i testy.
5. Każda zmiana ma mieć: cel, zakres, ryzyko, DoD i weryfikację.
6. Jedna zmiana = jeden commit.
7. Każdy task musi mieć PASS / FAIL.
8. Nie ma DONE bez dowodu.
9. Nie refaktoruj przy okazji.
10. Nie dodawaj nowych funkcji poza zakresem.
11. Jeśli task wymaga >20 plików albo >250 LOC diffu, przerwij i zrób re-plan.
12. Moduł zna tylko własne pliki i kontrakty, nie wnętrze całego repo.
13. UI, logika biznesowa i data access mają być rozdzielone.
14. Operacje krytyczne mają timeout, idempotency i fail-closed.
15. Pomysły poboczne zapisuj do ParkingLot.md, nie koduj ich teraz.
16. Po korekcie dopisz lesson do tasks/lessons.md.
17. Dobierz tryb pracy: MINIMAL_FIX / RUNTIME_FIX / STRUCTURE_FIX / FEATURE / AUDIT.
18. Nie wdrażaj wszystkich guardów naraz. Implementuj tylko REQUIRED.
19. Jeśli brakuje danych do bezpiecznej zmiany, nie koduj. Użyj ESCALATION.
20. Repo trzyma procedurę, prompt trzyma outcome.
21. Scope lock jest mechaniczny: task wskazuje tryb zmiany i allowlistę plików.
22. Dla projektowania taska głównym dokumentem jest `docs/AGENT_READY_WORKFLOW.md`.

## Prompting rule for GPT-5.5 / Codex

Nie przeładowuj promptu procedurą.

Prompt roboczy ma zawierać:
- outcome,
- kryteria sukcesu,
- ograniczenia,
- dostępne dowody,
- wymagany format odpowiedzi.

Procedura żyje w repo:
- AGENTS.md,
- docs/ARCHITECTURE_GUARDS.md,
- docs/CODE_STRUCTURE_GUARDS.md,
- docs/CONTEXT_BUDGET_GUARD.md.

## Think Before Coding

Przed implementacją:
- nazwil założenia,
- pokaż niejasności,
- pokaż prostszą opcję, jeśli istnieje,
- nie zgaduj po cichu.

## Escalation

Jeśli brakuje dowodu, logu, testu, pliku albo reprodukcji:
- nie koduj,
- wypisz brakujące dane,
- zaproponuj najmniejszy test/audit,
- oznacz status jako BLOCKED_BY_MISSING_EVIDENCE.

## Simplicity First

Zakaz:
- funkcji poza zakresem,
- abstrakcji dla jednorazowego kodu,
- konfiguracji bez potrzeby,
- future-proofingu bez dowodu,
- helperów użytych raz.

Jeśli 200 linii da się zrobić w 50, zrób 50.

## Surgical Changes

Dotykaj tylko tego, co konieczne.
Nie poprawiaj sąsiedniego kodu przy okazji.
Nie zmieniaj stylu bez potrzeby.
Każda zmieniona linia ma mieć związek z taskiem.

Przed zmianą ustaw w `tasks/todo.md`:
- `Tryb zmiany: code-change`, `audit-only` albo `release-build`.
- `Dozwolone pliki do zmiany` jako twardą allowlistę.

Jeśli git pokazuje plik spoza allowlisty, zatrzymaj pracę i rozstrzygnij scope przed kontynuacją.

## AI-ready codebase

Repo musi być zrozumiałe modułami.

Każdy moduł:
- ma jedną odpowiedzialność,
- ma własny kontrakt,
- ma testy przy module,
- nie importuje wnętrza obcych modułów.

If agent musi czytać >20 plików, task albo architektura są źle zaprojektowane.

## Design Review Before Codegen

Przy większych zmianach agent najpierw robi design review:
1. jakie moduły są dotykane,
2. jakie kontrakty się zmieniają,
3. jaki jest najmniejszy wariant,
4. czego nie ruszamy,
5. jak sprawdzamy wynik.

Dopiero potem kod.

## Fundamentals Before Automation

Nie automatyzujemy chaosu.

Przed dodaniem nowego workflow, agenta, adaptera lub feature:
- sprawdź moduły,
- sprawdź kontrakty,
- sprawdź source of truth,
- sprawdź test,
- sprawdź czy zmiana jest lokalna.

Jeśli nie - najpierw popraw fundament.

## Determinism

Jedno źródło prawdy.
Brak podwójnego liczenia.
Stan krytyczny zapisany jawnie.
Replay/ledger tam, gdzie proces wymaga dowodu.
Writer zapisuje, replay porównuje.

## Performance and Limits

Każda operacja zewnętrzna ma:
- timeout,
- retry limit,
- fail state,
- brak nieskończonego polling loop.

Dla LLM:
- limit contextu,
- limit output tokenów,
- fail fast,
- fallback.

## Feature Flags

Nowa ryzykowna logika:
- ma flagę,
- domyślnie OFF,
- ma fallback,
- jest odwracalna.

## Parking Lot

Pomysły dobre, ale niepotrzebne teraz, zapisuj w ParkingLot.md.
Nie koduj ich przy okazji.

## Lessons

Po każdej korekcie dopisz do tasks/lessons.md:
- błąd,
- przyczynę,
- regułę zapobiegawczą,
- test/guardrail.

## Gates

Local work:
- nearest focused test,
- `npm run check:task` gdy `tasks/todo.md` jest dotknięty albo wymagany,
- `npm run check:diff-size` przed commitem,
- `npm run check:godfiles` przed commitem,
- `npm run gate:local` dla pełnej lokalnej bramy.

PR/main:
- `npm run gate:pr` przed PR albo push,
- `npm run gate:main` przed merge albo zamknięciem kandydata.

`DONE` znaczy lokalny DoD i dowody. `MERGE READY` znaczy, że bramy PR/main są spełnione.
