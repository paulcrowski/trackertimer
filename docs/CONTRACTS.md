# CONTRACTS.md

Definicje kontraktów między modułami.

## Zasada
Moduły komunikują się wyłącznie przez kontrakty.
Zabronione jest importowanie wnętrza obcych modułów.

## Formaty
Każdy kontrakt powinien definiować:
- INPUT
- SUCCESS
- ERRORS
- STATUSES
- SIDE EFFECTS
