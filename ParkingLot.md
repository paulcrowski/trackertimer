# Parking Lot

## Import-boundary checker per framework

## Dlaczego nie teraz
Obecny task naprawia brak mechanicznego scope locka w starterze. Import-boundary checker wymaga reguł zależnych od stacka konkretnej aplikacji.

## Kiedy wrócić
Po utworzeniu realnej aplikacji web/mobile i ustaleniu mapy modułów oraz aliasów importów.

## Ryzyko
Dodanie tego teraz stworzyłoby fałszywie uniwersalny guard, który będzie blokował poprawne projekty albo przepuszczał złe granice.

## Generator tasków

## Dlaczego nie teraz
Szablon i checki wystarczają do obecnego problemu. Generator byłby nowym subsystemem workflow.

## Kiedy wrócić
Gdy ręczne wypełnianie `tasks/todo.md` zacznie regularnie powodować błędy.

## Ryzyko
Overbuild i kolejna warstwa utrzymania zamiast prostego repo-native workflow.
