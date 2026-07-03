# Archived Task

Closed At: 2026-07-03T09:37:52.960Z
Result: PASS
Source File: tasks/todo.md

# Current Task

Task ID: 2026-07-03-audit-private-local-mode-entry-choice
Task Date: 2026-07-03
Task Status: ACTIVE

## Tryb pracy
AUDIT

Uzasadnienie trybu:
Diagnoza bez zmiany plikow projektu.

## Cel / Outcome
Ustalic bezpieczna architekture prywatnego local-only mode w worktimerze oraz odpowiedziec, czy wybor trybu musi byc na starcie przed logowaniem i bootstrapem Convexa.

## Kryteria sukcesu
- Jest jasna decyzja architektoniczna: kiedy uzytkownik wybiera tryb

## Priorytet / Blocker
Największy blocker teraz: Ustalic bezpieczna architekture prywatnego local-only mode w worktimerze oraz odpowiedziec, czy wybor trybu musi byc na starcie przed logowaniem i bootstrapem Convexa.
Dowód blockera: polecenie użytkownika i aktualny task
Czy ten task rusza blocker: TAK
Jeśli NIE, powód: NOT_APPLICABLE
Dlaczego mimo to robimy teraz: nie dotyczy
Warunek powrotu do blockera: nie dotyczy

## Kontekst dla agenta
Moduł: auth+storage
Tryb zmiany: audit-only
Dozwolone pliki do zmiany:
- tasks/todo.md
- tasks/archive/**
Kontrakty do przeczytania: tylko zrodla potrzebne do audytu
Czego nie ruszać: wszystkie pliki projektu

## Zakres
Moduł: auth+storage
Pliki: tasks/todo.md

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
- App startuje dziś zawsze przez `ConvexAuthProvider` i `ConvexReactClient` w `src/main.tsx`, zanim użytkownik wybierze jakikolwiek tryb pracy.
- Po zalogowaniu `App.tsx` zawsze odpala `useQuery(anyApi.tracker.bootstrap, isAuthenticated ? {} : 'skip')`, więc cloud path jest aktualnie domyślny i automatyczny.
- Lokalny storage w repo jest dziś tylko pomocniczy: snapshot aktywnej sesji, auth verifier/tokens fallback i pomodoro; nie jest pełnym źródłem prawdy dla trackera.
- `100% local danych trackera` da się osiągnąć tylko wtedy, gdy local mode w ogóle nie wykonuje query/mutation do Convexa.
- Zostawienie Google login oznacza, że tryb nie będzie `100% private overall`; może być co najwyżej `local-only dla danych pracy, ale nie dla auth`.

## Dowody
- `src/main.tsx:10-101` tworzy `ConvexReactClient`, kończy OAuth callback i zawsze renderuje `ConvexAuthProvider`.
- `src/App.tsx:71-76` wiąże runtime z `useConvexAuth()` i `tracker.bootstrap`.
- `src/lib/tracker.ts:83-168` pokazuje, że lokalny storage obsługuje tylko snapshot aktywnej sesji, nie pełny model sesji/historii/reguł/preferencji.
- `convex/tracker.ts:319+` trzyma cały kanoniczny model trackera po stronie Convexa.

## Ryzyka
- Jeśli wybór local/cloud nastąpi dopiero po loginie albo po bootstrapie, użytkownik dostanie fałszywe poczucie prywatności, bo app mogła już odczytać/zapisać dane w chmurze.
- `localStorage` samo w sobie jest zbyt kruche jako kanoniczna baza lokalna; dla prywatnego mode bezpieczniejszy jest `IndexedDB`.
- `login zostaje + dane local-only` komplikuje komunikat produktu: konto jest nadal cloud-authenticated, więc trzeba bardzo jasno oddzielić `auth` od `danych pracy`.
- Przełączanie trybów bez jawnego kontraktu migracji może prowadzić do mieszania źródeł prawdy i przypadkowego syncu.

## Plan naprawczy
Rekomendowany kontrakt:
1. Ekran startowy przed auth i przed bootstrapem: `Cloud sync` albo `Private local`.
2. `Cloud sync`: obecny flow `Google + Convex`.
3. `Private local`: osobny runtime bez `ConvexAuthProvider`, bez `tracker.bootstrap`, bez mutacji do Convexa; dane trackera trzymane lokalnie, najlepiej w `IndexedDB`.
4. Jeśli chcesz zostawić Google login także w local mode, zrób to jako osobny wariant po podstawowym local mode i komunikuj uczciwie: `konto w chmurze, dane pracy tylko lokalnie`.
5. Późniejsze przełączenie trybu dopiero po jawnym eksporcie/importcie albo potwierdzonym starcie od zera.

## Weryfikacja
Komendy:
- `nl -ba src/main.tsx | sed -n '1,140p'`
- `nl -ba src/App.tsx | sed -n '70,170p'`
- `nl -ba src/lib/tracker.ts | sed -n '51,170p'`
- `nl -ba convex/tracker.ts | sed -n '319,380p'`
Expected result: PASS albo jawny blocker.

## Review / Wyniki
Co zmieniono: audit-only, bez zmian w plikach projektu.
Jak sprawdzono: przejrzano aktualny entry flow auth/bootstrap oraz lokalny storage seam w `src/main.tsx`, `src/App.tsx`, `src/lib/tracker.ts` i backendowy source of truth w `convex/tracker.ts`.
PASS / FAIL: PASS
Ryzyka: brak browser/runtime proof, ale kontrakt architektoniczny wynika wprost z obecnego kodu.
Follow-up: osobny `FEATURE` albo najpierw `AUDIT` szczegółowego kontraktu `Private local` na `IndexedDB` z wyborem trybu przed auth/bootstrap.
