# Agent-Ready Workflow

Cel tego dokumentu: projektowac taski tak, zeby agent mogl wykonac je lokalnie, deterministycznie i z dowodem PASS/FAIL.

`AGENTS.md` jest always-on entrypointem. Ten dokument jest ladowany tylko wtedy, gdy task wymaga projektowania albo poprawy taska.

## Tryby pracy

Kazdy task musi miec tryb:

- `MINIMAL_FIX` - maly bugfix, max 3 pliki, max 50 LOC, bez zmiany kontraktu i architektury.
- `CONTENT_FIX` - copy, statyczna tresc albo maly UI polish, max 3 pliki, max 80 LOC, bez runtime/danych/source of truth.
- `RUNTIME_FIX` - API, worker, parser, kolejka, cache, provider, UI status, fetchowanie, integracja.
- `STRUCTURE_FIX` - duzy plik, zaleznosci, granice modulow, god file.
- `FEATURE` - nowa funkcja albo nowe zachowanie.
- `AUDIT` - analiza bez kodowania.

Nie kazdy task odpala pelna procedure. Drobny fix potrzebuje root cause, minimalnego fixa i najblizszego testu. Runtime, struktura i feature wymagaja kontraktu, failure modes, Guard Scope i planu testow.

## Escalation

Jesli brakuje danych do bezpiecznej zmiany, nie koduj.

Uzyj formatu:

```text
ESCALATION:

Brakujace dane:
- ...

Czego nie moge potwierdzic:
- ...

Ryzyko kodowania teraz:
- ...

Najmniejszy nastepny krok:
- audit / test / log / reprodukcja

Status: BLOCKED_BY_MISSING_EVIDENCE
```

## Guard Scope

Dla `RUNTIME_FIX`, `STRUCTURE_FIX` i `FEATURE` podziel guardy:

- `REQUIRED GUARDS` - konieczne do aktualnego taska.
- `NICE_TO_HAVE GUARDS` - dobre, ale nie teraz.
- `OVERBUILD GUARDS` - nie robic w tym tasku.

Implementuj tylko `REQUIRED`. Reszte zapisz do `ParkingLot.md`, jesli jest uzyteczna.

## Closed Loop

Kazdy task dla agenta musi byc zamknietym ukladem:

```text
REPRO -> FAIL -> FIX -> PASS
```

Agent musi wiedziec:
- co ma zrobic,
- w jakim zakresie dziala,
- jak odtworzyc problem,
- jak sprawdzic wynik,
- co oznacza `PASS`,
- co oznacza `FAIL`.

Jesli task tego nie zawiera, task jest zle zaprojektowany. Nie zaczynaj kodowania. Najpierw popraw task.

## Dobry task

Dobry task jest:
- scoped,
- closed loop,
- reproducible,
- deterministic,
- non-global.

Regula praktyczna:
- idealnie 3-10 plikow,
- maksymalnie 10-20 plikow,
- jesli agent musi czytac wiecej niz 20 plikow, task trzeba podzielic.

## Standard taska

Kazdy task powinien miec:

```text
CEL:
...

ZAKRES:
Modul: ...
Pliki: ...
Poza zakresem: ...

REPRO:
...

WERYFIKACJA:
...

PASS:
...

FAIL:
...
```

Bez tego agent bedzie zgadywal.

## Minimalny format przed kodowaniem

Dla `MINIMAL_FIX`:
- tryb,
- root cause,
- dowod,
- minimalny fix,
- najblizszy test.

Dla `CONTENT_FIX`:
- tryb,
- root cause,
- dowod,
- minimalny fix,
- test albo visual/render proof.

Dla `RUNTIME_FIX` / `STRUCTURE_FIX` / `FEATURE`:
- tryb,
- diagnoza,
- granice,
- kontrakt,
- failure modes,
- Guard Scope,
- plan testow,
- plan zmiany.

Dla `AUDIT`:
- fakty,
- dowody,
- ryzyka,
- minimalny plan naprawczy,
- zero kodu.
