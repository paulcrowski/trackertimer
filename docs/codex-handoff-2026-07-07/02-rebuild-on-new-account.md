# Odtworzenie projektu na nowym koncie

Ten plan zakłada, że stare konto Codex/Convex/Cloudflare/Google może być niedostępne. Nie opiera się na sekretach ze starego konta.

## 1. Kod i repo

1. Sklonuj repo albo przenieś je na nowe konto GitHub.

```bash
git clone https://github.com/paulcrowski/trackertimer.git
cd trackertimer
git status --short --branch
```

2. Sprawdź, czy branch bazowy to `master`.
3. Zainstaluj Node.js 22+.
4. Zainstaluj zależności:

```bash
npm install
```

5. Uruchom lokalny gate:

```bash
npm run ci
```

Jeśli ten gate nie przechodzi, napraw najpierw lokalny kontrakt. Nie zaczynaj od deployu.

## 2. Nowy Convex

1. Zaloguj się do Convex na nowym koncie.
2. Uruchom:

```bash
npx convex dev
```

3. Utwórz nowy projekt/deployment, jeśli CLI o to zapyta.
4. Zapisz nowy frontend URL Convex do `.env.local`:

```bash
VITE_CONVEX_URL="https://<new-deployment>.convex.cloud"
```

5. Nie commituj `.env.local`.

## 3. Nowy Google OAuth

Kod używa:

```ts
import Google from '@auth/core/providers/google';
```

Provider może czytać wartości z env Auth.js. Dla tego repo ustaw w Convex env co najmniej:

```text
AUTH_GOOGLE_ID=<new-google-client-id>
AUTH_GOOGLE_SECRET=<new-google-client-secret>
AUTH_SECRET=<new-random-auth-secret>
```

W Google Cloud Console utwórz nową aplikację OAuth. Callback musi wskazywać na nowy Convex site URL. Dla Convex Auth sprawdź realny callback w aktualnych logach/docs, ale typowy kierunek to site URL z `convex.site`, nie frontend `pages.dev`.

Przykładowy site URL:

```text
https://<new-deployment>.convex.site
```

Po ustawieniu OAuth przetestuj logowanie Google lokalnie i na hostingu.

## 4. Convex deploy

Po lokalnym proofie:

```bash
npx convex deploy
```

Sprawdź, że produkcyjny Convex ma:

- aktualny schema,
- aktualne functions,
- env OAuth/Auth ustawione dla produkcji,
- poprawny `CONVEX_SITE_URL` po stronie Convex runtime.

## 5. Frontend hosting

Repo jest statycznym Vite buildem. Naturalna ścieżka:

```bash
VITE_CONVEX_URL="https://<new-deployment>.convex.cloud" npm run build
```

Potem deploy `dist/` do Cloudflare Pages albo innego hostingu statycznego.

Jeśli używasz Cloudflare Pages przez Wrangler:

```bash
npx wrangler pages deploy dist --project-name <new-pages-project>
```

Nie zakładaj, że push do GitHuba wdraża stronę. Ten projekt historycznie miał ręczny Pages deploy.

## 6. Helper na nowym koncie

Helper key jest per user/per Convex deployment. Po zmianie konta:

1. Zaloguj się w appce przez nowy Google auth.
2. Włącz flow helpera w UI i wygeneruj nowy helper key.
3. Skopiuj nowy ingest URL i key.
4. Uruchom:

```bash
node worktimer-helper.mjs --url "https://<new-deployment>.convex.site/api/desktop/activity" --key "<new-helper-key>"
```

5. W UI sprawdź, że helper przechodzi na connected i pokazuje ostatnią appkę/domenę.

Stary helper key nie ma wartości na nowym koncie/deploymencie.

## 7. Dane użytkownika

Nie ma tu gotowego eksportu/importu bazy Convex między kontami.

Dostępne ścieżki:

- Cloud user może wyeksportować historię CSV z UI.
- Private local zostaje w IndexedDB konkretnej przeglądarki i nie przejdzie automatycznie na inne urządzenie.
- Migracja pełnych danych cloud wymagałaby osobnego skryptu eksport/import przez Convex; nie jest obecnie częścią repo.

Jeśli celem jest zachowanie historii po zmianie konta, najpierw dodaj jawny, testowany flow importu CSV albo skrypt migracyjny. Nie rób ręcznych wpisów w produkcyjnej bazie bez backupu i proofu.
