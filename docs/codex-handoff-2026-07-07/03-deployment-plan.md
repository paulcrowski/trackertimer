# Plan wdrożenia

Plan jest rozdzielony na gate'y. Nie traktuj jednego zielonego kroku jako dowodu całości.

## Gate 0: stan repo

```bash
git status --short --branch
git log --oneline --decorate -5
```

Oczekiwane:

- wiesz, na jakim branchu pracujesz,
- rozumiesz lokalne zmiany,
- nie mieszasz dokumentacji/handoffu z kodem funkcjonalnym bez potrzeby.

## Gate 1: lokalny kod

```bash
npm install
npm run ci
```

Oczekiwane:

- TypeScript bez błędów,
- testy przechodzą,
- Vite build przechodzi.

Proof z 2026-07-07:

- `npm run ci` przeszedł,
- 41 testów pass,
- build wygenerował `dist/`.

## Gate 2: lokalny Convex dev

```bash
npx convex dev
npm run dev
```

Sprawdź ręcznie:

- chooser startowy pokazuje Cloud i Private local,
- Private local działa bez logowania,
- Cloud login startuje flow Google,
- start/pauza/stop zapisuje sesję,
- manual add/edit/delete działa,
- CSV export działa.

## Gate 3: nowy Convex production

```bash
npx convex deploy
```

Sprawdź:

- `convex/schema.ts` wdrożony,
- `convex/http.ts` wystawia `/api/desktop/activity`,
- Google OAuth env istnieją w prod Convex,
- auth callback pasuje do nowego Google OAuth clienta.

Minimalny smoke endpointu helpera bez klucza powinien zwrócić auth error, nie 404:

```bash
curl -i -X POST "https://<deployment>.convex.site/api/desktop/activity" \
  -H "content-type: application/json" \
  --data '{"appName":"Smoke","platform":"manual"}'
```

Oczekiwane:

```text
HTTP 401
Missing helper key.
```

Jeśli dostajesz 404, prawdopodobnie używasz złego hosta albo HTTP functions nie są wdrożone.

## Gate 4: frontend production build

```bash
VITE_CONVEX_URL="https://<deployment>.convex.cloud" npm run build
```

Potem deploy statycznego `dist/`.

Cloudflare Pages przykład:

```bash
npx wrangler pages deploy dist --project-name <pages-project>
```

Sprawdź publiczny URL:

```bash
curl -I -L "https://<pages-project>.pages.dev"
```

Oczekiwane:

```text
HTTP/2 200
```

## Gate 5: public browser smoke

W realnej przeglądarce sprawdź:

- publiczny URL ładuje appkę,
- nie ma fallbacku na brak `VITE_CONVEX_URL`,
- Cloud login działa na nowym Google OAuth,
- po loginie można wystartować i zatrzymać sesję,
- Private local nadal działa bez loginu,
- odświeżenie strony nie gubi aktywnej sesji w ramach kontraktu snapshotu,
- CSV export zawiera pełną historię, nie tylko limit widoku.

## Gate 6: helper smoke

1. W UI wygeneruj helper key.
2. Uruchom helper:

```bash
node worktimer-helper.mjs --url "https://<deployment>.convex.site/api/desktop/activity" --key "<helper-key>"
```

3. Otwórz kilka aplikacji/domen.
4. Sprawdź UI:

- helper `connected`,
- ostatnia appka/domena aktualizuje się,
- reguła app/domena -> projekt daje sugestię,
- prywatna domena jest maskowana,
- helper silence auto-pause działa tylko w advanced mode.

## Gate 7: release bookkeeping

Po proofach:

```bash
git status --short
git log --oneline --decorate -5
```

Zapisz w docs albo release note:

- commit,
- Convex deployment,
- frontend URL,
- public smoke result,
- helper endpoint smoke result,
- znane ograniczenia.

Nie pisz “wdrożone”, jeśli masz tylko commit albo tylko lokalny build.
