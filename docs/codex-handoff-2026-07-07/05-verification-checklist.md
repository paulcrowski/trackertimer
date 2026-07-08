# Checklisty weryfikacji

## Lokalny gate

```bash
git status --short --branch
npm run ci
```

Oczekiwane:

- brak niechcianych zmian,
- typecheck pass,
- test pass,
- build pass.

## Private local smoke

W przeglądarce:

- otwórz `http://localhost:3000`,
- wybierz `Private local`,
- start sesji,
- pauza,
- resume,
- stop,
- dodaj manualną sesję,
- edytuj sesję,
- usuń sesję,
- eksport CSV,
- odśwież stronę i sprawdź, że historia została.

Negatywny kontrakt:

- jeśli IndexedDB jest niedostępne albo uszkodzone, appka ma pokazać błąd/wybór trybu, nie pusty workspace udający sukces.

## Cloud smoke

- ustaw `VITE_CONVEX_URL`,
- uruchom `npx convex dev`,
- uruchom `npm run dev`,
- zaloguj przez Google,
- start/pauza/resume/stop,
- manual add/edit/delete,
- export CSV,
- sign-out bez aktywnej sesji wraca do chooser,
- sign-out z aktywną sesją jest blokowany albo jasno obsłużony zgodnie z UI.

## Cross-midnight smoke

Testy automatyczne już obejmują ten kontrakt. Przy ręcznej zmianie modelu sprawdź:

- `23:50 -> 00:20` daje dwa rekordy dzienne,
- identyczny start/stop jest odrzucany,
- pauza przecinająca północ nie zawyża duration.

## Helper endpoint smoke

Bez klucza:

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

Z kluczem:

```bash
curl -i -X POST "https://<deployment>.convex.site/api/desktop/activity" \
  -H "authorization: Bearer <helper-key>" \
  -H "content-type: application/json" \
  --data '{"appName":"Smoke","platform":"manual","domain":"example.com","windowTitle":"Smoke"}'
```

Oczekiwane:

```text
HTTP 200
{"ok":true}
```

Potem sprawdź UI, czy helper status/ostatnia aktywność się aktualizuje.

## Helper app smoke

```bash
node worktimer-helper.mjs --url "https://<deployment>.convex.site/api/desktop/activity" --key "<helper-key>"
```

Sprawdź:

- macOS: wymagana zgoda na sterowanie/Accessibility/Automation, jeśli system zapyta,
- Windows: PowerShell i UI Automation muszą móc czytać foreground window,
- UI pokazuje connected w czasie poniżej progu 20 sekund,
- po zatrzymaniu helpera UI przechodzi w stale/silent,
- advanced auto-pause mówi `Cisza helpera`,
- simple auto-pause mówi o bezczynności w oknie appki.

## Production smoke

```bash
curl -I -L "https://<public-frontend-url>"
```

Oczekiwane:

```text
HTTP/2 200
```

W browserze:

- załaduj publiczny URL,
- sprawdź Cloud login,
- sprawdź Private local,
- wykonaj jedną krótką sesję testową,
- usuń testową sesję albo oznacz ją jawnie jako smoke,
- sprawdź console/network pod kątem błędów auth/Convex.

## Dokumentowanie proofu

Po każdym realnym wdrożeniu dopisz krótką notkę:

```text
date:
commit:
convex deployment:
frontend url:
local gate:
convex deploy:
frontend deploy:
public smoke:
helper smoke:
known gaps:
```

Nie wpisuj `PASS`, jeśli wynik jest tylko częściowy.
