Startuj od AGENTS.md.
AGENT_DEV_POLICY.md czytaj tylko wtedy, gdy AGENTS.md albo aktualny task wyraźnie tego wymaga.

Dla runtime/API/worker/UI stosuj docs/ARCHITECTURE_GUARDS.md.
Dla dużych plików, granic modułów i zależności stosuj docs/CODE_STRUCTURE_GUARDS.md.
Dla kosztu kontekstu stosuj docs/CONTEXT_BUDGET_GUARD.md.

Nie koduj bez dowodu.
Nie ma DONE bez weryfikacji.
Nie refaktoruj przy okazji.
Nie dotykaj plików poza zakresem.
Dobierz właściwy tryb pracy: MINIMAL_FIX / RUNTIME_FIX / STRUCTURE_FIX / FEATURE / AUDIT.
Jeśli brakuje dowodów, użyj ESCALATION i nie koduj.
