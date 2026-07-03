# Archived Task

Closed At: 2026-07-03T18:24:00.353Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-public-readme-and-env-scrub
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
CONTENT_FIX

Uzasadnienie trybu:
Agent wybral najmniejszy bezpieczny tryb pracy.

## Cel / Outcome
Usunąć z publicznego README i .env.example twarde identyfikatory produkcji oraz martwy template config, który nie dotyczy tego repo.

## Kryteria sukcesu
- README używa generycznych placeholderów zamiast realnych deployment IDs/URLs

## Priorytet / Blocker
Największy blocker teraz: Usunąć z publicznego README i .env.example twarde identyfikatory produkcji oraz martwy template config, który nie dotyczy tego repo.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: public-repo-hygiene
Tryb zmiany: code-change
Dozwolone pliki do zmiany:
- README.md
- .env.example
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: tylko pliki potrzebne do taska
Czego nie ruszać: pliki poza zakresem

## Zakres
Moduł: public-repo-hygiene
Pliki: README.md, .env.example

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
Test: komenda albo visual/render proof dobrany przez agenta.

## Plan
- [ ] Przeczytać tylko pliki potrzebne do zmiany.
- [ ] Wykonać minimalny diff.
- [ ] Uruchomić weryfikację.

## Weryfikacja
Komendy:
ustali agent przed zamknieciem taska
Expected result: PASS.

## Review / Wyniki
Co zmieniono: README stracił realne prod URL/deployment IDs i używa placeholderów; `.env.example` zawiera już tylko `VITE_CONVEX_URL`, które repo naprawdę czyta.
Jak sprawdzono: `npm test`, `npm run gate:local`.
PASS / FAIL: PASS
Ryzyka: produkcyjne identyfikatory nadal są w `tasks/archive/**`, bo ten task czyścił tylko publiczny entry docs/config.
Follow-up: jeśli repo ma być bardzo czyste publicznie, osobny task na redukcję albo usunięcie internal task archive z gałęzi publicznej.
