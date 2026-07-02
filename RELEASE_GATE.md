# RELEASE_GATE.md

Kryteria dopuszczenia zmiany do głównej gałęzi (main).

## Wymagania
1. `npm run check:task` PASS
2. `npm run check:task-freshness` PASS
3. `npm run check:scope` PASS
4. `npm run check:diff-size` PASS
5. `npm run check:godfiles` PASS
6. `npm run check:project-gates` PASS
7. `npm run check:import-boundaries` PASS
8. Brak błędów w logach
9. Review zakończone

## Świeżość taska

Aktualny task musi mieć:
- `Task ID: YYYY-MM-DD-slug`,
- `Task Date: YYYY-MM-DD`,
- `Task Status: ACTIVE`.

Task z innym statusem, przyszłą datą albo datą starszą niż 3 dni nie przechodzi release gate.

## Limity diffu

`check:diff-size` używa trybu pracy z `tasks/todo.md`:

| Tryb pracy | Limit liczonych plików | Limit liczonych linii |
| --- | ---: | ---: |
| `MINIMAL_FIX` | 3 | 50 |
| `RUNTIME_FIX` | 12 | 250 |
| `STRUCTURE_FIX` | 12 | 250 |
| `FEATURE` | 12 | 250 |
| `AUDIT` | 0 | 0 |

Jeśli task przekracza limit, trzeba przerwać i zrobić re-plan albo rozbić zmianę na mniejsze commity.

## Project gates

Jeśli repo zawiera kod aplikacji, release gate wymaga scriptów:
- `lint`,
- `typecheck`,
- `test`,
- `build`.

W pustym starterze check przechodzi jako `no app paths detected`.

## Import boundaries

`workflow/import-boundaries.json` definiuje warstwy i dozwolone kierunki importów. Naruszenie lokalnego importu między warstwami blokuje release gate.

## Scope lock

Każdy task musi wskazać `Tryb zmiany`:
- `code-change` - wolno zmienić tylko pliki z allowlisty.
- `audit-only` - nie wolno zmienić żadnego pliku.
- `release-build` - wolno zmieniać artefakty generowane, ale tylko jeśli są w allowliście.

`artifacts/**` jest domyślnie zablokowane poza `release-build`.
