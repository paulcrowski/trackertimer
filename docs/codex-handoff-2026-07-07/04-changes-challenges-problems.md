# Zmiany, wyzwania i problemy

Ten plik streszcza rzeczy, które drugi AI powinien wiedzieć przed dalszą pracą.

## Ważne zmiany, które już są w kodzie

- Publiczne README zostały uproszczone i oczyszczone z nadmiaru szczegółów infrastruktury.
- GitHub workflow został usunięty z repo; lokalny gate to `npm run ci`.
- Private local korzysta z IndexedDB, a nie tylko localStorage.
- Private local ma fail-closed, gdy storage jest niedostępny albo uszkodzony.
- Po sign-out wraca wybór trybu, zamiast cichego przeskoku.
- Startowy chooser nie zakłada cloud bez realnego auth state.
- Manualne sesje i stopped sessions dzielą się poprawnie przez północ.
- Pauzy są odejmowane precyzyjnie, także przez północ.
- Helper STOP summary maskuje prywatne konteksty i liczy focus-loss.
- Helper STOP summary nie udaje pełnego pokrycia, gdy brakuje początku/końca próbek.
- Advanced auto-pause używa ciszy helpera, a simple auto-pause bezczynności okna appki.
- Helper obsługuje macOS i Windows; Windows ma UI Automation URL lookup plus fallback z tytułu okna.
- Historia w UI może być limitowana, ale eksport ma używać pełnej listy sesji.

## Najważniejsze ryzyka

### 1. Zmiana konta nie przenosi backendu

Kod w GitHubie nie przenosi:

- Convex deployment,
- Google OAuth clienta,
- Auth secret,
- Cloudflare Pages projektu,
- helper key,
- danych użytkownika.

Nowy Codex ma traktować to jako rebuild infrastruktury, nie zwykły `git pull`.

### 2. Produkcja i git to różne proofy

Ten projekt historycznie wymagał ręcznego deployu frontendu. Commit/push nie wystarcza jako dowód produkcji. Trzeba oddzielać:

- lokalny gate,
- Convex deploy,
- frontend deploy,
- publiczny HTTP/browser smoke,
- helper endpoint smoke.

### 3. Helper preview vs persisted history

STOP summary z helpera jest podglądem doradczym. Persisted history nadal zapisuje sesje z manualnego start/stop i obecnego modelu segmentów. Jeśli produkt ma kiedyś zapisywać osobne work/private/distraction rows, to musi mieć osobny, testowany kontrakt UI + backend. Nie rób tego po cichu.

### 4. Privacy trust

Helper może łatwo naruszyć zaufanie, jeśli UI brzmi jak pełny monitoring. Obecny kierunek:

- użytkownik opt-in,
- private domains maskowane,
- manual pause helpera,
- local/private mode bez backendu,
- helper jako sugestia, nie arbiter prawdy.

Nie dodawaj “AI automation” bez jasnej kontroli użytkownika.

### 5. Private local nie jest backupem

Private local jest per browser/device. IndexedDB może zostać wyczyszczone przez użytkownika/przeglądarkę. Nie obiecuj synchronizacji ani odzyskiwania po zmianie komputera.

### 6. Limity historii i eksport

Cloud bootstrap limituje widok sesji do 100. Eksport powinien pobierać pełną historię przez osobne query. Przy zmianach w historii nie łam tego rozdziału.

### 7. Cross-midnight accounting

Model czasu ma sporo edge case'ów:

- manual session `23:50 -> 00:20`,
- aktywna sesja przez północ,
- pauza przecinająca północ,
- duration rounding.

Testy wokół tych przypadków są ważniejsze niż refaktor stylistyczny.

## Problemy nierozwiązane / do rozważenia

- Brak pełnego importu danych cloud między kontami.
- Brak oficjalnego export/import Private local poza CSV historii.
- Brak Linux support w helperze.
- Brak pełnego proofu helpera na realnej maszynie Windows w tym handoffie.
- Google OAuth setup nie jest zautomatyzowany w repo.
- Cloudflare Pages projekt i Convex project trzeba odtworzyć ręcznie na nowym koncie.
- Nie ma aktualnego CI w GitHub Actions po usunięciu workflow; lokalny `npm run ci` jest źródłem szybkiego gate'u.

## Zasada dla kolejnych zmian

Najpierw nazwij kontrakt, który zmieniasz. Potem dodaj albo aktualizuj test w `tests/app.test.tsx`. Dopiero potem zmieniaj UI/backend. Szczególnie dotyczy to auth, storage, helpera, auto-pauzy, eksportu i liczenia czasu.
