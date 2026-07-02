# Archived Task

Closed At: 2026-07-02T22:58:48.986Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-02-fix-tracker-stop-typecheck
Task Date: 2026-07-02
Task Status: ACTIVE

## Tryb pracy
MINIMAL_FIX

Uzasadnienie trybu:
Agent wybral najmniejszy bezpieczny tryb pracy.

## Cel / Outcome
Odblokowac deploy przez usuniecie TypeScript nullability error w stop() dla activeSession.

## Kryteria sukcesu
- Typecheck przechodzi

## Priorytet / Blocker
Największy blocker teraz: Odblokowac deploy przez usuniecie TypeScript nullability error w stop() dla activeSession.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: convex-tracker
Tryb zmiany: code-change
Dozwolone pliki do zmiany:
- tasks/todo.md
- convex/tracker.ts
- tasks/archive/**
Kontrakty do przeczytania: tylko pliki potrzebne do taska
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: convex-tracker
Pliki: tasks/todo.md, convex/tracker.ts

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
