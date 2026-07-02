# Imported workflow from thread `019ea6bf-1ddc-7e12-a137-fb115fc53c7e`

Source thread: `codex://threads/019ea6bf-1ddc-7e12-a137-fb115fc53c7e`

## Intent

Nie promptowac agenta od zera dla kazdego taska, tylko zbudowac lekki system petli, guardow i jawnego stanu pracy.

## Core position

- Nie robic pelnego `loop-native swarm`.
- Nie automatyzowac calego delivery.
- Przesunac prace z recznego promptowania na lekka orkiestracje taskow.
- Trzymac czlowieka na bramce dla intencji, smaku, architektury i tradeoffow.

## Recommended loop model

### 1. Discovery loop

Cel:
- zbieranie bugow,
- regresji,
- review comments,
- flaky testow,
- runtime issues.

Zasady:
- tylko discovery i triage,
- bez wdrazania zmian,
- wynik trafia do jawnego stanu pracy.

### 2. Delivery loop

Cel:
- wziac jeden blocker,
- wykonac `smallest safe change`,
- dowiezc konkretne `PASS/FAIL`.

Zasady:
- jeden task,
- jeden problem,
- waski scope,
- bez mieszania discovery z implementacja.

### 3. Verification loop

Cel:
- niezaleznie sprawdzic dowod wykonania,
- potwierdzic brak oczywistych skutkow ubocznych.

Zasady:
- nie pisac nowej logiki,
- sprawdzac tylko diff, dowod i kontrakt taska.

## Required state model

Kazdy loop powinien pracowac na jawnym stanie, a nie na samej historii chata.

Minimalne statusy:
- `Inbox`
- `Active`
- `Blocked`
- `ParkingLot`
- `Done with evidence`

## Task input contract

Kazdy task powinien startowac z formularzem:
- expected outcome,
- success criteria,
- constraints,
- evidence,
- allowed files,
- PASS/FAIL proof.

Jesli tych danych brakuje, agent powinien uzupelnic braki albo sie zablokowac zamiast zgadywac.

## Human vs agent split

Agent:
- triage,
- zbieranie dowodow,
- male bugfixy,
- pierwszy draft,
- test proof,
- verification checklist.

Czlowiek:
- intencja,
- estetyka,
- architektura,
- priorytety biznesowe,
- decyzje tradeoffowe,
- finalny gate dla zmian istotnych koncepcyjnie.

## Minimal safe rollout

Najmniejsza sensowna wersja:
- jeden plik `workflow.md` jako source of truth,
- jedna automatyzacja discovery/triage,
- jeden skill dla najczestszego typu taska, np. `RUNTIME_FIX`,
- jeden verification loop niezalezny od implementacji,
- zasada: kazdy task konczy sie `evidence + PASS/FAIL + next blocker`.

## What not to build now

- multi-agent swarms,
- pelna orkiestracja wszystkiego,
- wiele agentow robiacych to samo,
- zbyt szerokie autonomie bez twardego kontraktu,
- automations, ktore same wdrazaja zmiany bez jawnego wejscia do delivery loop.

## Token-cost guidance

- Loopi sa oplacalne glownie dla pracy powtarzalnej i dobrze ograniczonej.
- Proste taski moga byc tansze recznie.
- Zle zaprojektowany loop bardzo latwo przepala tokeny przez zbyt szeroki kontekst i zduplikowana analize.
- Sensowny cel to redukcja chaosu i liczby recznych doprecyzowan, nie "pelny autopilot".

## Practical recommendation from the thread

Nie robic rewolucji. Wdrozyc tylko:
- `intent freeze` przed code change,
- wezszy scope taskow,
- krotki `post-task review` po taskach wymagajacych recznej poprawki.

## Imported summary

Ten thread rekomenduje model `copilot with gates`, a nie `autopilot`.
Najbardziej wartosciowe elementy do przeniesienia to:
- 3 stale petle,
- jawny stan pracy,
- waski kontrakt taska,
- blocker-first policy,
- rozdzielenie discovery, implementacji i weryfikacji.
