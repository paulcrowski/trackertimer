# MODULE_MAP.md

Mapa modułów systemu i ich odpowiedzialności.

## Struktura
- **Core**: Logika biznesowa, reguły, centrum systemu.
- **Adapters**: Integracje zewnętrzne, DB, API clients.
- **UI**: Warstwa prezentacji.
- **Shared**: Wspólne typy i helpery (używane ostrożnie).

## Granice
Zależności idą od szczegółów do polityki (Adapters/UI -> Core).
Core nie zależy od Adapters ani UI.
