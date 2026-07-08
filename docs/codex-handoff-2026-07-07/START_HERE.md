# Codex handoff: worktimer / trackertimer

Ten katalog jest punktem startowym dla nowego Codexa po zmianie konta.

Nazwa katalogu do podania nowemu Codexowi:

```text
docs/codex-handoff-2026-07-07
```

Najkrótsza instrukcja dla nowej sesji:

```text
Najpierw przeczytaj docs/codex-handoff-2026-07-07/START_HERE.md i wszystkie pliki z tego katalogu. Potem sprawdź aktualny git status, package.json, README.pl.md, src/lib/tracker.ts, convex/tracker.ts i tests/app.test.tsx. Nie zakładaj, że stare konto Convex/Google/Cloudflare jest dostępne.
```

## Co to za projekt

`worktimer` to mała aplikacja do trackowania czasu pracy:

- frontend: React 19 + Vite + TypeScript,
- backend/sync: Convex + Convex Auth + Google,
- hosting frontendu: statyczne `dist/`, ostatnio Cloudflare Pages,
- tryby danych: `Google / cloud` oraz `Private local`,
- helper desktopowy: opcjonalny skrypt Node zbierający aktywną aplikację/domenę.

Najważniejszy kontrakt produktu: timer jest manual-first. Użytkownik ręcznie startuje, pauzuje i zatrzymuje sesję. Helper desktopowy jest warstwą asystującą do kontekstu, auto-pauzy, prywatności, podsumowań i splitów, a nie ukrytym pełnym auto-trackingiem.

## Stan zweryfikowany 2026-07-07

- Repo: `/Users/ppwro/_work/trackertimer`.
- Branch: `master`.
- Remote: `https://github.com/paulcrowski/trackertimer.git`.
- HEAD podczas tworzenia handoffu: `7b02ee4 Delete .github/workflows/pr-gate.yml`.
- Worktree przed zmianami docs był czysty.
- `npm run ci` przeszedł lokalnie: typecheck, 41 testów, build.
- Publiczny demo URL `https://worktimer-5gn.pages.dev` odpowiadał HTTP 200.

Te proofy nie znaczą, że nowe konto ma już skonfigurowany backend. Po zmianie konta trzeba odtworzyć osobno GitHub, Convex, Google OAuth i hosting.

## Kolejność czytania

1. `01-project-map.md` - mapa repo, moduły i aktualny kontrakt funkcji.
2. `02-rebuild-on-new-account.md` - jak odtworzyć projekt po zmianie konta.
3. `03-deployment-plan.md` - plan deployu z gate'ami.
4. `04-changes-challenges-problems.md` - co było zmieniane, jakie są ryzyka i problemy.
5. `05-verification-checklist.md` - checklisty lokalne, produkcyjne i helperowe.

## Nie przenosić sekretów

W repo nie powinno być sekretów. Nie kopiuj starego `.env`, tokenów Convex, Google OAuth secretów ani kluczy helpera do dokumentacji. Na nowym koncie wygeneruj je od nowa.
