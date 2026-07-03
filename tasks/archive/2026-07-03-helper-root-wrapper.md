# Archived Task

Closed At: 2026-07-03T07:59:58.193Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-helper-root-wrapper
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
MINIMAL_FIX

Uzasadnienie trybu:
Agent wybral najmniejszy bezpieczny tryb pracy.

## Cel / Outcome
Zrealizować task: helper-root-wrapper.

## Kryteria sukcesu
- Task ma dowód PASS.

## Priorytet / Blocker
Największy blocker teraz: Zrealizować task: helper-root-wrapper.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: desktop helper entrypoint
Tryb zmiany: code-change
Dozwolone pliki do zmiany:
- tasks/todo.md
- tasks/archive/**
- worktimer-helper.mjs
Kontrakty do przeczytania: tylko pliki potrzebne do zmiany
Czego nie ruszać: helper logic w `scripts/desktop-helper.mjs` i pliki poza zakresem

## Zakres
Moduł: desktop helper entrypoint
Pliki: tasks/todo.md, worktimer-helper.mjs

## Escalation
Czy brakuje danych do bezpiecznej zmiany?
NIE

Jeśli TAK:
Status: BLOCKED_BY_MISSING_EVIDENCE
Najmniejszy następny krok: audit albo test reprodukcyjny

## Klasyfikacja
REQUIRED

Uzasadnienie:
Zmiana jest wymagana dla aktualnego outcome.

## Diagnoza
Root cause: user uruchomil `node worktimer-helper.mjs ...` z root repo, ale taki plik nie istnieje; realny helper jest w `scripts/desktop-helper.mjs`.
Dowód: `Cannot find module '/Users/ppwro/_work/trackertimer/worktimer-helper.mjs'` oraz obecność `scripts/desktop-helper.mjs`.
Minimalny fix: dodać root wrapper `worktimer-helper.mjs`, który odpala `main()` z `scripts/desktop-helper.mjs`.
Test: `node worktimer-helper.mjs` ma zwrócić usage z helpera zamiast `MODULE_NOT_FOUND`.

## Plan
- [ ] Dodać wrapper w root repo.
- [ ] Uruchomić minimalny test wejścia.

## Weryfikacja
Komendy:
- `node worktimer-helper.mjs`
Expected result: PASS - helper wypisuje usage, nie `MODULE_NOT_FOUND`.

## Review / Wyniki
Co zmieniono: dodano root wrapper `worktimer-helper.mjs`, który uruchamia `main()` z `scripts/desktop-helper.mjs`.
Jak sprawdzono: `node worktimer-helper.mjs`
PASS / FAIL: PASS
Ryzyka: brak; helper logic pozostaje w jednym miejscu w `scripts/desktop-helper.mjs`.
Follow-up: user moze teraz uruchomic helper z root repo albo z pobranego startera.
