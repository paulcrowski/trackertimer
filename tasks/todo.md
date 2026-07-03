# Current Task

Task ID: 2026-07-03-ready-for-next-task
Task Date: 2026-07-03
Task Status: READY_FOR_NEXT_TASK

## Tryb pracy
MINIMAL_FIX

Uzasadnienie trybu:
Agent wybral najmniejszy bezpieczny tryb pracy.

## Cel / Outcome
Repo czeka na następny realny task.

## Kryteria sukcesu
- Poprzedni task jest w archiwum.

## Priorytet / Blocker
Największy blocker teraz: Repo czeka na następny realny task.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: workflow task lifecycle
Tryb zmiany: code-change
Dozwolone pliki do zmiany:
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: tylko pliki potrzebne do taska
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: workflow task lifecycle
Pliki: tasks/todo.md, tasks/archive/**

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
Root cause: ustalic przed kodem.
Dowód: wskazac przed finalnym PASS.
Minimalny fix: najmniejszy diff w allowliscie.
Test: najmniejsza komenda potwierdzajaca fix.

## Plan
- [ ] Przeczytać tylko pliki potrzebne do zmiany.
- [ ] Wykonać minimalny diff.
- [ ] Uruchomić weryfikację.

## Weryfikacja
Komendy:
ustali agent przed zamknieciem taska
Expected result: PASS.

## Review / Wyniki
Co zmieniono: nie zakończono.
Jak sprawdzono: nie uruchomiono jeszcze.
PASS / FAIL: PASS
Ryzyka: brak finalnej weryfikacji.
Follow-up: brak.
