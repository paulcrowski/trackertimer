# Archived Task

Closed At: 2026-07-03T12:51:52.494Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-active-session-source-truth-audit
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
AUDIT

Uzasadnienie trybu:
Diagnoza bez zmiany plikow projektu.

## Cel / Outcome
Potwierdzić, czy aktywna sesja i snapshoty mają jeden spójny source of truth między cloud, local mode i reloadem.

## Kryteria sukcesu
- Audit wskaże tylko potwierdzone konflikty source of truth albo jawnie potwierdzi ich brak.

## Priorytet / Blocker
Największy blocker teraz: Potwierdzić, czy aktywna sesja i snapshoty mają jeden spójny source of truth między cloud, local mode i reloadem.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: active-session-source-truth
Tryb zmiany: audit-only
Dozwolone pliki do zmiany:
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: tylko zrodla potrzebne do audytu
Czego nie ruszać: wszystkie pliki projektu

## Zakres
Moduł: active-session-source-truth
Pliki: brak

## Escalation
Czy brakuje danych do bezpiecznej diagnozy?
NIE

Jeśli TAK:
Status: BLOCKED_BY_MISSING_EVIDENCE
Najmniejszy następny krok: zebrac brakujacy dowod

## Klasyfikacja
REQUIRED

Uzasadnienie:
Audit jest wymagany przed bezpieczna zmiana albo decyzja.

## Fakty
1. `finishOAuthRedirect()` w `src/main.tsx` obsługuje krytyczny callback Google/Convex przed renderem Reacta, ale jego błąd kończy się tylko `console.error(...)`, po czym app renderuje się normalnie.
2. `CloudApp` pokazuje błędy tylko przez lokalny stan `error` ustawiany w handlerach Reactowych (`signIn`, mutacje trackera). Callback OAuth z `src/main.tsx` nie ma ścieżki do tego stanu.
3. W headerze cloud mode przycisk ma label `Zmień sesję`, ale `handleSignOut()` wywołuje bezpośrednio `onSignOut()` bez żadnego sprawdzenia `activeSession`.
4. `onSignOut` w cloud mode robi tylko auth sign-out. Nie ma żadnego `stop`, `pause`, confirm dialogu ani ostrzeżenia o aktywnej sesji w trackerze.

## Dowody
- [src/main.tsx](/Users/ppwro/_work/trackertimer/src/main.tsx:76): callback OAuth czyta `code`, wymienia tokeny i czyści URL tylko po sukcesie.
- [src/main.tsx](/Users/ppwro/_work/trackertimer/src/main.tsx:225): `.catch((error) => { console.error(...) }).finally(renderApp)` renderuje app bez przekazania błędu do UI.
- [src/App.tsx](/Users/ppwro/_work/trackertimer/src/App.tsx:382): `AuthScreen` widzi tylko `error` z lokalnego stanu `CloudApp`.
- [src/components/SessionDialogs.tsx](/Users/ppwro/_work/trackertimer/src/components/SessionDialogs.tsx:106): headerowy przycisk mówi `Zmień sesję`.
- [src/lib/tracker.ts](/Users/ppwro/_work/trackertimer/src/lib/tracker.ts:1400): `handleSignOut()` robi tylko `return onSignOut()`.
- [src/components/TrackerWorkspace.tsx](/Users/ppwro/_work/trackertimer/src/components/TrackerWorkspace.tsx:118): header dostaje `active={Boolean(controller.activeSession)}`, więc UI zna stan aktywnej sesji, ale nie używa go do guardu sign-out.

## Ryzyka
1. `high` - Silent auth failure:
Objaw: użytkownik wraca z Google callbacku i po błędzie widzi zwykły ekran logowania/wyboru trybu bez informacji, że logowanie padło.
Dlaczego groźne: krytyczny flow auth wygląda jak neutralny stan, więc użytkownik nie odróżni awarii od własnego wylogowania; to psuje zaufanie i utrudnia support/debug.
Jak odtworzyć albo po czym poznać: wymuś błąd w `auth:signIn` albo w sieci podczas callbacku z `?code=...`; UI nie pokaże błędu, tylko `console.error`.
Minimalny kierunek naprawy: przenieść wynik callbacku OAuth do reader-facing stanu startowego i pokazać jawny błąd/retry path; nie renderować “czystego” auth ekranu jakby nic się nie stało.
Klasyfikacja: REQUIRED.

2. `high` - False contract przy `Zmień sesję`:
Objaw: w cloud mode można się wylogować przy aktywnym timerze bez stop/pause/confirm, mimo że UI komunikuje stan `Pracuję`.
Dlaczego groźne: użytkownik może uznać, że zamknął swoją sesję pracy, a runtime zostawi timer lecący w chmurze i zafałszuje dane czasu.
Jak odtworzyć albo po czym poznać: uruchom sesję w cloud, kliknij `Zmień sesję`, zaloguj się później tym samym kontem; aktywna sesja nadal istnieje po stronie trackera.
Minimalny kierunek naprawy: przy aktywnej sesji zablokować sign-out bez confirmu albo wymusić `STOP`/`PAUSE` przed wylogowaniem; copy przycisku musi obiecywać to, co realnie robi.
Klasyfikacja: REQUIRED.

## Plan naprawczy
1. Dodać osobny task `RUNTIME_FIX` na auth callback error contract.
2. Dodać osobny task `RUNTIME_FIX` na sign-out guard przy aktywnej sesji.
3. Nie łączyć tych zmian w jeden commit, bo to dwa różne krytyczne flow i dwa różne kontrakty produktu.

## Weryfikacja
Komendy:
`nl -ba src/main.tsx | sed -n '76,229p'`
`nl -ba src/App.tsx | sed -n '339,430p'`
`nl -ba src/components/SessionDialogs.tsx | sed -n '43,109p'`
`nl -ba src/components/TrackerWorkspace.tsx | sed -n '118,131p'`
`nl -ba src/lib/tracker.ts | sed -n '1400,1402p'`
Expected result: PASS albo jawny blocker.

## Review / Wyniki
Co zmieniono: audit-only, bez zmian w kodzie produktu.
Jak sprawdzono: przegląd flow i referencji w `src/main.tsx`, `src/App.tsx`, `src/components/SessionDialogs.tsx`, `src/components/TrackerWorkspace.tsx`, `src/lib/tracker.ts`.
PASS / FAIL: PASS
Ryzyka: nie potwierdzałem live browserem ani symulacją błędu OAuth; findingi są jednak bezpośrednio potwierdzone przez brak ścieżek obsługi w kodzie.
Follow-up: dwa osobne taski runtime, bez poszerzania scope o refactor auth lub całego session controllera.
