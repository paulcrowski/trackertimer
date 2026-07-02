# TASK_LIFECYCLE.md

## Cel

Ten plik opisuje, jak agent ma pracowac z `task:new` i `task:close`.

Uzytkownik nie wypelnia taska recznie.
Uzytkownik mowi outcome.
Agent sam wybiera tryb pracy, tworzy task i zamyka go po dowodzie PASS albo FAIL.

## Jak to ma dzialac

Minimalny flow:

1. Uzytkownik mówi, co ma byc zrobione.
2. Agent ocenia ryzyko zmiany.
3. Agent uruchamia `npm run task:new ...`.
4. Agent czyta tylko potrzebne pliki.
5. Agent robi najmniejsza bezpieczna zmiane.
6. Agent uruchamia weryfikacje.
7. Agent aktualizuje `tasks/todo.md`.
8. Agent uruchamia `npm run task:close -- --result PASS` albo `FAIL`.

## Dobor trybu pracy

`MINIMAL_FIX`
- maly bugfix
- max 3 pliki / 50 LOC
- bez runtime, danych, providerow i krytycznego flow

`CONTENT_FIX`
- copy, statyczna tresc, maly UI polish
- max 3 pliki / 80 LOC
- bez API, auth, DB, workerow, providerow, security i zrodla prawdy

`RUNTIME_FIX`
- API, worker, parser, kolejka, cache, UI status, provider

`STRUCTURE_FIX`
- duzy plik, granice modulow, zaleznosci, god file

`FEATURE`
- nowa funkcja

`AUDIT`
- diagnoza bez kodowania
- domyslnie `audit-only`

## Krotki vs pelny task

Agent nie powinien generowac pelnego formularza dla kazdego taska.

Krotki task:
- `MINIMAL_FIX`
- `CONTENT_FIX`
- `AUDIT`

Pelny task:
- `RUNTIME_FIX`
- `STRUCTURE_FIX`
- `FEATURE`

Powod:
- lekkie taski nie powinny placic tokenowo za sekcje runtime, kontrakty i failure modes, jesli nie dotykaja takiego ryzyka,
- ciezkie taski dalej musza miec pelny formularz, bo tam koszt bledu jest wiekszy.

## Co generuje `task:new`

Dla `MINIMAL_FIX` i `CONTENT_FIX`:
- cel,
- kryteria sukcesu,
- blocker,
- scope,
- root cause,
- minimalny fix,
- weryfikacja,
- review PASS / FAIL

Dla `AUDIT`:
- cel,
- blocker,
- scope,
- fakty,
- dowody,
- ryzyka,
- plan naprawczy

Dla `RUNTIME_FIX`, `STRUCTURE_FIX`, `FEATURE`:
- pelny formularz z kontraktem,
- failure modes,
- guard scope,
- definition of done

## Co daje mniej tokenow

Najwieksza oszczednosc bierze sie z 3 rzeczy:

1. Agent nie tworzy wielkiego taska dla prostego fixa.
2. Agent nie czyta runtime guardow, jesli task ich nie potrzebuje.
3. Uzytkownik nie traci czasu na reczne uzupelnianie formularza.

To nie znaczy "mniej zasad".
To znaczy "te same zasady, ale ladowane tylko wtedy, gdy sa potrzebne".

## Czego nie robic

- nie zmuszac uzytkownika do recznego pisania taska
- nie wrzucac `CONTENT_FIX` do runtime albo auth
- nie robic `AUDIT`, jesli celem jest realna zmiana kodu
- nie generowac pelnego formularza dla literowki albo prostego copy fixa
- nie luzowac guardow dla danych, API, providerow i side effectow

## Przyklady

Przyklad 1:
`popraw literowke w komunikacie`

Agent powinien wybrac:
`MINIMAL_FIX` albo `CONTENT_FIX`

Przyklad 2:
`zmien hero copy i przycisk na landing page`

Agent powinien wybrac:
`CONTENT_FIX`

Przyklad 3:
`napraw status po bledzie providera`

Agent powinien wybrac:
`RUNTIME_FIX`

Przyklad 4:
`sprawdz dlaczego flow sie rozjezdza`

Agent powinien wybrac:
`AUDIT`

## Zamkniecie taska

Po weryfikacji agent powinien:

1. wpisac konkretne dowody do `tasks/todo.md`
2. ustawic wynik PASS albo FAIL
3. uruchomic `npm run task:close -- --result PASS` albo `FAIL`

Task lifecycle ma chronic repo przed dryfem.
Nie ma byc dodatkowa praca dla uzytkownika.

Po `task:close` plik `tasks/todo.md` nie powinien juz udawac aktywnego taska. Stan oczekiwania to `Task Status: READY_FOR_NEXT_TASK`.
