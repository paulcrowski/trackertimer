# Lessons

## Data
2026-05-11

## Błąd
Workflow miał zasady zakresu, ale nie miał mechanicznego scope locka.

## Przyczyna
Gate sprawdzał formularz taska, rozmiar diffu i duże pliki, ale nie porównywał realnie zmienionych plików z allowlistą taska.

## Reguła zapobiegawcza
Każdy task deklaruje `Tryb zmiany` i `Dozwolone pliki do zmiany`; gate failuje przy zmianach spoza allowlisty, przy diffie w `audit-only` i przy `artifacts/**` poza `release-build`.

## Test / guardrail
`npm run check:scope` wpięty w `gate:local` i `gate:pr`.

## Data
2026-05-12

## Błąd
`MINIMAL_FIX` miał deklarowany limit 3 pliki / 50 LOC, ale brama diff-size stosowała luźny globalny limit 12 plików / 250 LOC.

## Przyczyna
Polityka workflow i mechaniczny guard rozjechały się: instrukcja ograniczała mały fix, ale skrypt nie czytał trybu pracy z `tasks/todo.md`.

## Reguła zapobiegawcza
Limity rozmiaru diffu muszą wynikać z trybu pracy, a nie z jednego globalnego progu.

## Test / guardrail
`scripts/check-diff-size.js` egzekwuje `MINIMAL_FIX` jako 3 liczone pliki / 50 liczonych linii i ma env-based test seam dla numstat/task file.

## Data
2026-05-12

## Błąd
Workflow mógł użyć starego `tasks/todo.md` jako przepustki, jeśli formularz i allowlista nadal pasowały do diffu.

## Przyczyna
Guardy sprawdzały strukturę taska, scope i rozmiar diffu, ale nie wymagały aktywnego statusu, identyfikatora ani świeżej daty taska.

## Reguła zapobiegawcza
Bieżący task musi mieć `Task ID`, `Task Date` i `Task Status: ACTIVE`; stary albo zamknięty task ma failować przed sprawdzeniem scope.

## Test / guardrail
`scripts/check-task-freshness.js` jest wpięty w `gate:local` i `gate:pr`; negatywne testy obejmują `DONE` oraz task starszy niż limit.

## Data
2026-05-12

## Błąd
Starter mógł zostać użyty do realnej aplikacji bez faktycznych `lint/typecheck/test/build` oraz bez mechanicznego sprawdzania granic importów.

## Przyczyna
Dokumenty mówiły o dopięciu testów i modularności, ale `gate:local` / `gate:pr` nie miały guardów dla project scripts ani import boundaries.

## Reguła zapobiegawcza
Pusty starter nie udaje testów, ale po wykryciu kodu aplikacji musi wymagać realnych project gates; import boundaries muszą być konfigurowane per stack w repo.

## Test / guardrail
`scripts/check-project-gates.js` wymaga `lint/typecheck/test/build` po wykryciu app code; `scripts/check-import-boundaries.js` blokuje zakazane lokalne importy według `workflow/import-boundaries.json`.

## Data
2026-05-19

## Błąd
Failure-first zasady były dobrze opisane w `docs/ARCHITECTURE_GUARDS.md`, ale krótki entrypoint `AGENTS.md` nie przypominał wprost 6 pytań dla runtime/data/UI/status tasków.

## Przyczyna
Szczegółowa procedura była poprawna, ale najważniejszy skrót produkcyjnej nieufności mógł zniknąć przy szybkim tasku.

## Reguła zapobiegawcza
Dla runtime, danych, API, workerów, parserów, providerów, UI statusu i side-effectów agent musi przed kodem wskazać root cause, kontrakt, failure modes, state/statusy, test plan i dowód PASS/FAIL.

## Test / guardrail
`AGENTS.md` ma krótki `Failure-first` anchor, a szczegóły nadal żyją w `docs/ARCHITECTURE_GUARDS.md`.

## Data
2026-05-19

## Błąd
Agent musiał ręcznie przepisywać `tasks/todo.md` przy starcie i końcu pracy.

## Przyczyna
Workflow miał mechaniczne guardy, ale nie miał mechanicznego lifecycle taska.

## Reguła zapobiegawcza
Codex powinien tworzyć nowy task przez `task:new`, a zakończony task archiwizować przez `task:close`.

## Test / guardrail
`scripts/task-lifecycle.js` obsługuje `task:new` i `task:close`; ma fixture-friendly opcje `--task-file` i `--archive-dir`, więc można je testować bez ruszania realnego taska.

## Data
2026-05-29

## Błąd
Agent może mylić łatwy zielony progres w repo z realnym postępem wobec najważniejszego blockera produktu.

## Przyczyna
Task miał scope, testy i dowód PASS/FAIL, ale nie wymuszał odpowiedzi, czy aktualna praca rusza największy blocker.

## Reguła zapobiegawcza
Każdy task musi mieć `Priorytet / Blocker`: największy blocker teraz, czy task go rusza, a jeśli nie, dlaczego mimo to robimy go teraz.

## Test / guardrail
`scripts/check-task.js` wymaga sekcji `Priorytet / Blocker`, a `scripts/task-lifecycle.js` generuje ją dla nowych tasków.

## Data
2026-05-29

## Błąd
Samo pole `Czy ten task rusza blocker` usuwało cichy dryf, ale nadal pozwalało na słabe uzasadnienie `NIE`.

## Przyczyna
Guard nie wymagał dowodu blockera, kontrolowanego powodu odstępstwa ani warunku powrotu do głównej pracy.

## Reguła zapobiegawcza
Task musi mieć `Dowód blockera`, a dla `Czy ten task rusza blocker: NIE` musi użyć jednego z dozwolonych powodów i wskazać warunek powrotu do blockera.

## Test / guardrail
`scripts/check-task.js` waliduje dowód, kontrolowane powody `NIE`, warunek powrotu oraz blokuje drugi kolejny archived task z `NIE`.

## Data
2026-06-04

## Błąd
Runtime-grade workflow byl zbyt ciezki dla prostych zmian copy i statycznego UI, co moglo zachecac agenta do przepalania czasu na guardy niezwiazane z ryzykiem taska.

## Przyczyna
Workflow mial `MINIMAL_FIX` i pelne tryby runtime/feature, ale brakowalo osobnego lekkiego trybu dla tresci i UI polish bez danych, providerow, auth ani zrodla prawdy.

## Reguła zapobiegawcza
Uzywaj `CONTENT_FIX` tylko dla copy, statycznej tresci i malego UI polish. Jesli task dotyka API, auth, DB, workerow, providerow, security, danych uzytkownika albo kanonicznego statusu, wraca do runtime/structure/feature guardow.

## Test / guardrail
`scripts/task-lifecycle.js`, `scripts/check-task.js` i `scripts/check-diff-size.js` znaja `CONTENT_FIX`; limit diffu to 3 liczone pliki / 80 liczonych linii.

## Data
2026-06-04

## Błąd
Pełny formularz taska dla każdego trybu pracy zwiekszal zuzycie tokenow i tarcie, mimo ze uzytkownik chce tylko powiedziec agentowi outcome.

## Przyczyna
`task:new` mial jeden duzy szablon dla wszystkich trybow, a `check-task` wymagal pelnych sekcji nawet dla MINIMAL_FIX, CONTENT_FIX i AUDIT.

## Reguła zapobiegawcza
Task lifecycle jest narzedziem agenta, nie uzytkownika. Agent wybiera najmniejszy bezpieczny tryb, a generator tworzy krotki formularz dla lekkich trybow i pelny formularz tylko dla zmian runtime/structure/feature.

## Test / guardrail
`scripts/task-lifecycle.js` generuje mode-aware templates, a `scripts/check-task.js` waliduje wymagane sekcje zależnie od trybu pracy.

## Data
2026-06-24

## Błąd
Always-on wejscie workflow znow zaczelo rosnac, bo entrypoint rozlalo sie na `AGENTS.md`, `AGENT_DEV_POLICY.md` i domyslne czytanie `README.md`, a zamkniety task nadal wygladal jak aktywna praca.

## Przyczyna
`AGENTS.md` traktowalo `AGENT_DEV_POLICY.md` jako obowiazkowe, pelny task wpisywal `README.md` jako kontrakt do przeczytania, a `task:close` resetowal `tasks/todo.md` do stanu `ACTIVE`.

## Reguła zapobiegawcza
`AGENTS.md` ma byc jedynym always-on entrypointem. `AGENT_DEV_POLICY.md` i `README.md` sa tylko on-demand. Po `task:close` repo ma miec jawny stan `READY_FOR_NEXT_TASK`, nie pseudo-aktywny task.

## Test / guardrail
`scripts/task-lifecycle.js` wpisuje tylko `AGENTS.md` jako domyslny entrypoint pelnego taska, a `scripts/check-task-freshness.js` akceptuje `READY_FOR_NEXT_TASK` jako stan oczekiwania.
