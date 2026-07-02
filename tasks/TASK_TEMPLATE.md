# TASK_TEMPLATE

To nie jest juz glowny sposob tworzenia taska.

Najpierw uzyj:

```bash
npm run task:new -- --slug ... --mode ... --change-mode ... --files ...
```

Powod:
- `task:new` dobiera dlugosc formularza do ryzyka taska,
- lekkie taski nie placa za runtime sections, ktorych nie potrzebuja,
- runtime/structure/feature dalej dostaja pelny formularz.

## Minimalny szkic referencyjny

Kazdy task musi miec:

```text
Task ID:
Task Date:
Task Status: ACTIVE

## Tryb pracy
...

## Cel / Outcome
...

## Kryteria sukcesu
...

## Priorytet / Blocker
...

## Kontekst dla agenta
...

## Weryfikacja
...

## Review / Wyniki
PASS / FAIL: ...
```

## Co zalezy od trybu

`MINIMAL_FIX` / `CONTENT_FIX`
- root cause,
- dowod,
- minimalny fix,
- najblizszy test albo visual/render proof.

`AUDIT`
- fakty,
- dowody,
- ryzyka,
- plan naprawczy,
- zero kodu.

`RUNTIME_FIX` / `STRUCTURE_FIX` / `FEATURE`
- reprodukcja,
- granice,
- kontrakt,
- failure modes,
- Guard Scope,
- plan testow,
- Definition of Done.

## Zasada

Jesli task nie daje zamknietego loopa `REPRO -> FAIL -> FIX -> PASS`, popraw task przed kodowaniem.
