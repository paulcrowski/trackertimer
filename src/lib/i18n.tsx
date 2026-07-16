import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'en' | 'pl';

const languageStorageKey = 'worktimer.language';

const polish: Record<string, string> = {
  'Worktimer — know where your work time goes.': 'Worktimer — wiesz, na co idzie Twój czas pracy.',
  'Without remembering every minute yourself.': 'Bez zapisywania każdej minuty z osobna.',
  'Keep your focus without tracking every minute yourself.':
    'Skup się na pracy bez zapisywania każdej minuty z osobna.',
  'Start manually, let optional automatic desktop tracking notice your context, then review the summary before saving.':
    'Zacznij ręcznie, pozwól opcjonalnemu automatycznemu śledzeniu pulpitu rozpoznać kontekst, a potem sprawdź podsumowanie przed zapisem.',
  'Sign in to sync your sessions, or use the optional automatic desktop tracking to turn work context into a summary you can review.':
    'Zaloguj się, aby synchronizować sesje, albo użyj opcjonalnego automatycznego śledzenia pulpitu, które zamienia kontekst pracy w podsumowanie do sprawdzenia.',
  'Choose how to save your time': 'Wybierz, gdzie zapisywać swój czas',
  'How Worktimer works': 'Jak działa Worktimer',
  'Worktimer steps': 'Kroki Worktimera',
  'Show step': 'Pokaż krok',
  'Automatic tracking demo': 'Demo automatycznego śledzenia',
  '01 / START': '01 / START',
  'You choose when work begins.': 'Ty decydujesz, kiedy zaczyna się praca.',
  'A simple manual timer stays the source of truth.':
    'Prosty ręczny timer pozostaje źródłem prawdy.',
  '02 / NOTICE': '02 / WYKRYWANIE',
  'Automatic tracking notices context.': 'Automatyczne śledzenie rozpoznaje kontekst.',
  'Worktimer recognizes the apps and browser context around your session.':
    'Worktimer rozpoznaje aplikacje i kontekst przeglądarki podczas sesji.',
  '03 / REVIEW': '03 / PODSUMOWANIE',
  'You decide what the day meant.': 'Ty decydujesz, co naprawdę wydarzyło się w ciągu dnia.',
  'At STOP, the activity becomes an editable summary — not a verdict.':
    'Po STOP aktywność zmienia się w edytowalne podsumowanie — nie w wyrok.',
  '04 / RHYTHM': '04 / RYTM',
  'Work in cycles. Stop before you overwork.':
    'Pracuj w cyklach. Zatrzymaj się, zanim się przepracujesz.',
  'Focus cycles show the progress you made and when it is time to take a break.':
    'Cykle skupienia pokazują postęp i podpowiadają, kiedy zrobić przerwę.',
  'Manual control': 'Ręczna kontrola',
  'detected automatically': 'wykryto automatycznie',
  'context switch': 'zmiana kontekstu',
  'Session summary ready': 'Podsumowanie sesji gotowe',
  '18m focused · 3 context switches': '18 min skupienia · 3 zmiany kontekstu',
  'Review, edit, or delete before saving': 'Sprawdź, edytuj lub usuń przed zapisem',
  'Focus cycle in progress': 'Cykl skupienia w toku',
  'of 25:00': 'z 25:00',
  '+1 focus win': '+1 cykl skupienia',
  'See your rhythm, then stop on time.': 'Zobacz swój rytm i zakończ pracę na czas.',
  'Quick preview': 'Szybki podgląd',
  'Automatic tracking, in 12 seconds': 'Automatyczne śledzenie w 12 sekund',
  'No helper installation · no data collected': 'Bez instalowania helpera · bez zbierania danych',
  'Preview the flow': 'Zobacz przebieg',
  'Sample session · no data collected': 'Przykładowa sesja · dane nie są zbierane',
  'See automatic tracking in action': 'Zobacz automatyczne śledzenie w akcji',
  'Worktimer notices context while you work, then gives you a summary you can correct.':
    'Worktimer rozpoznaje kontekst pracy, a potem pokazuje podsumowanie, które możesz poprawić.',
  'Step 1 · Manual timer': 'Krok 1 · Ręczny timer',
  'Step 2 · Automatic detection': 'Krok 2 · Automatyczne wykrywanie',
  'Step 3 · You press STOP': 'Krok 3 · Naciskasz STOP',
  'Step 4 · Editable summary': 'Krok 4 · Edytowalne podsumowanie',
  'You choose when work begins': 'Ty decydujesz, kiedy zaczyna się praca',
  'START SESSION': 'START SESJI',
  'The helper notices context automatically — no typing required':
    'Helper automatycznie rozpoznaje kontekst — nie musisz nic wpisywać',
  'building the next feature': 'budowanie kolejnej funkcji',
  'checking the live app': 'sprawdzanie aplikacji online',
  'a short context switch': 'krótka zmiana kontekstu',
  detected: 'wykryto',
  'When you are done, you press STOP — Worktimer has the context':
    'Gdy skończysz, naciskasz STOP — Worktimer ma już kontekst pracy',
  'No silent session. No guesswork.': 'Bez cichego śledzenia. Bez zgadywania.',
  editable: 'edytowalne',
  'focused work': 'skupiona praca',
  '4m': '4 min',
  '2m': '2 min',
  'review needed': 'wymaga sprawdzenia',
  'Chrome activity': 'aktywność w Chrome',
  'Review, edit, or delete the automatically created blocks before saving.':
    'Sprawdź, edytuj lub usuń automatycznie utworzone bloki przed zapisem.',
  'Private by design · review before saving': 'Prywatność z założenia · sprawdź przed zapisem',
  Replay: 'Odtwórz ponownie',
  'Close demo': 'Zamknij demo',
  'Sign-in is taking longer than usual, but you can start the login flow now.':
    'Logowanie trwa dłużej niż zwykle, ale możesz już rozpocząć proces logowania.',
  'Choose how to work.': 'Wybierz sposób pracy.',
  'Sync to the cloud or keep everything private on this device.':
    'Synchronizuj z chmurą albo zachowaj wszystko prywatnie na tym urządzeniu.',
  'Cloud sync keeps your Google sign-in and data in Convex. Private local keeps your timer data only in this browser on this device.':
    'Synchronizacja w chmurze przechowuje logowanie Google i dane w Convex. Tryb prywatny lokalny trzyma dane timera tylko w tej przeglądarce na tym urządzeniu.',
  'Cloud sync + Google': 'Synchronizacja w chmurze + Google',
  'Private local': 'Prywatnie lokalnie',
  'Cloud sync requires `VITE_CONVEX_URL` in this environment. Private local works without this configuration.':
    'Synchronizacja w chmurze wymaga w tym środowisku `VITE_CONVEX_URL`. Tryb prywatny lokalny działa bez tej konfiguracji.',
  'Private local requires local `IndexedDB` storage, so work data cannot be safely persisted in this environment.':
    'Tryb prywatny lokalny wymaga lokalnego storage `IndexedDB`, więc dane pracy nie mogą być bezpiecznie zapisane w tym środowisku.',
  'Two storage modes': 'Dwa tryby przechowywania',
  'Cloud sync: one account across devices.':
    'Synchronizacja w chmurze: jedno konto na wielu urządzeniach.',
  'Private local: no tracker queries or mutations reach Convex.':
    'Prywatnie lokalnie: żadne zapytania ani zmiany trackera nie trafiają do Convex.',
  'You can switch modes later without removing your Google sign-in.':
    'Możesz później zmienić tryb bez usuwania logowania Google.',
  'Get straight into your work rhythm.': 'Wejdź od razu w rytm pracy.',
  'Keep your focus in one clear rhythm.': 'Utrzymaj skupienie w jednym, przejrzystym rytmie.',
  'Session history, work trends, manual corrections, and your preferences in one source of truth on Convex.':
    'Historia sesji, trendy pracy, ręczne poprawki i preferencje w jednym źródle prawdy w Convex.',
  'Sign in with Google': 'Zaloguj przez Google',
  'The same account works across devices.': 'To samo konto działa na wielu urządzeniach.',
  'Ready-to-use workspace': 'Gotowy obszar pracy',
  'Live timer with manual stop and optional auto-pause.':
    'Timer z ręcznym stopem i opcjonalną auto-pauzą.',
  'Manual add, edit, delete, and CSV export.': 'Ręczne dodawanie, edycja, usuwanie i eksport CSV.',
  'Category breakdown and a 30-day trend in a lightweight UI.':
    'Podział na kategorie i trend z 30 dni w lekkim interfejsie.',
  'Time tracker': 'Timer pracy',
  Settings: 'Ustawienia',
  'Turn on focus mode': 'Włącz tryb skupienia',
  'Turn off focus mode': 'Wyłącz tryb skupienia',
  'PWA installed': 'PWA zainstalowana',
  'Install app': 'Zainstaluj aplikację',
  Working: 'Praca',
  Work: 'Praca',
  Paused: 'Wstrzymany',
  'Sign out': 'Wyloguj',
  'Google account': 'Konto Google',
  Dismiss: 'Ukryj',
  'Recover the restored local session.': 'Odzyskaj przywróconą sesję lokalną.',
  'Save manually': 'Zapisz ręcznie',
  'Discard recovery': 'Odrzuć odzyskiwanie',
  'Tracking mode': 'Tryb śledzenia',
  'Automatic helper': 'Automatyczny helper',
  'Basic timer': 'Podstawowy timer',
  Basic: 'Podstawowy',
  Auto: 'Auto',
  'Auto requires Cloud sync. Basic works locally on this device.':
    'Auto wymaga synchronizacji w chmurze. Tryb podstawowy działa lokalnie na tym urządzeniu.',
  'Auto status': 'Status Auto',
  'Auto is running': 'Auto działa',
  'Auto is offline': 'Auto offline',
  'Waiting for helper': 'Czekam na helper',
  'Scanning active app and window title outside this window.':
    'Skanuje aktywną aplikację i tytuł okna poza tym oknem.',
  'No app yet': 'Brak aplikacji',
  'No window title yet': 'Brak tytułu okna',
  'Active session': 'Aktywna sesja',
  'Start the timer when you begin a focused piece of work.':
    'Uruchom timer, gdy zaczynasz skoncentrowany blok pracy.',
  'Work category': 'Kategoria pracy',
  Materials: 'Materiały',
  Coding: 'Kodowanie',
  'Club app': 'Aplikacja klubowa',
  Patronite: 'Patronite',
  Communication: 'Komunikacja',
  Recording: 'Nagrania',
  Research: 'Badania',
  UX: 'UX',
  Administration: 'Administracja',
  Private: 'Prywatne',
  Distraction: 'Rozproszenie',
  Other: 'Inne',
  Project: 'Projekt',
  'What are you working on?': 'Nad czym pracujesz?',
  'Enter a short task description...': 'Wpisz krótki opis zadania…',
  Resume: 'Wznów',
  START: 'START',
  STOP: 'STOP',
  'You stop the timer manually; Pomodoro only provides a signal.':
    'Timer zatrzymujesz ręcznie; Pomodoro daje tylko sygnał.',
  'Auto-pause: on': 'Auto-pauza: włączona',
  'Auto-pause: off': 'Auto-pauza: wyłączona',
  'Long session check-in': 'Kontrola długiej sesji',
  'Review session': 'Sprawdź sesję',
  'Disconnect helper': 'Odłącz helpera',
  'Connect helper': 'Podłącz helpera',
  'Helper auto-pause: on': 'Auto-pauza helpera: włączona',
  'Helper auto-pause: off': 'Auto-pauza helpera: wyłączona',
  Inactivity: 'Bezczynność',
  'Helper silence': 'Cisza helpera',
  min: 'min',
  'Auto-paused after inactivity.': 'Wstrzymano automatycznie po bezczynności.',
  Pomodoro: 'Pomodoro',
  'A focus and break cycle without another app':
    'Cykl skupienia i przerwy bez dodatkowej aplikacji',
  Focus: 'Skupienie',
  Break: 'Przerwa',
  'Cycle running': 'Cykl działa',
  'Cycle complete': 'Cykl zakończony',
  'Ready to start': 'Gotowe do startu',
  Reset: 'Resetuj',
  'System notifications on': 'Powiadomienia systemowe włączone',
  'Notifications blocked': 'Powiadomienia zablokowane',
  'Notification API not supported': 'API powiadomień nie jest obsługiwane',
  'Notifications are waiting for permission': 'Powiadomienia czekają na zgodę',
  'Enable notifications': 'Włącz powiadomienia',
  'Work dashboard': 'Dashboard pracy',
  'Daily pace, streaks, and your strongest session signals':
    'Dzienne tempo, serie i najmocniejsze sygnały z sesji',
  'Daily goal': 'Dzienny cel',
  Today: 'Dzisiaj',
  'Progress:': 'Postęp:',
  'Remaining:': 'Pozostało:',
  'This week': 'Ten tydzień',
  'Measured from Monday in your local time.': 'Liczone od poniedziałku w Twoim czasie lokalnym.',
  'This month': 'Ten miesiąc',
  'Useful for tracking your publishing and deep-work pace.':
    'Przydatne do śledzenia tempa publikowania i głębokiej pracy.',
  'Current streak': 'Aktualna seria',
  'Consecutive days with at least one saved session.':
    'Kolejne dni z co najmniej jedną zapisaną sesją.',
  'Average session': 'Średnia sesja',
  'Calculated from all saved work sessions.': 'Obliczone ze wszystkich zapisanych sesji pracy.',
  'Best day': 'Najlepszy dzień',
  'It will appear after your first saved session.': 'Pojawi się po zapisaniu pierwszej sesji.',
  'Top project': 'Najważniejszy projekt',
  'Assign a session to a project to see a separate total.':
    'Przypisz sesję do projektu, aby zobaczyć osobną sumę.',
  Total: 'Łącznie',
  'Last 14 days': 'Ostatnie 14 dni',
  'Work rhythm, day by day': 'Rytm pracy dzień po dniu',
  sessions: 'sesji',
  'Last 7 days': 'Ostatnie 7 dni',
  'Time by category': 'Czas według kategorii',
  'No data from the last 7 days.': 'Brak danych z ostatnich 7 dni.',
  'Last 30 days': 'Ostatnie 30 dni',
  'Daily activity trend': 'Dzienny trend aktywności',
  'Activity trend for the last 30 days': 'Trend aktywności z ostatnich 30 dni',
  'There is no trend data to draw yet.': 'Nie ma jeszcze danych do narysowania trendu.',
  'Max:': 'Maks.:',
  'Session history': 'Historia sesji',
  'Workdays with editing, filtering, and export': 'Dni pracy z edycją, filtrowaniem i eksportem',
  'Add manually': 'Dodaj ręcznie',
  'Export CSV': 'Eksportuj CSV',
  'Full CSV export': 'Pełny eksport CSV',
  Search: 'Szukaj',
  'description, note, category...': 'opis, notatka, kategoria…',
  Category: 'Kategoria',
  All: 'Wszystkie',
  'Edit session': 'Edytuj sesję',
  'Delete session': 'Usuń sesję',
  'No sessions match these filters. Clear the search or choose a different category.':
    'Żadna sesja nie pasuje do filtrów. Wyczyść wyszukiwanie albo wybierz inną kategorię.',
  'No saved sessions for this account yet. Start by entering a focused block of work.':
    'To konto nie ma jeszcze zapisanych sesji. Zacznij od wpisania skoncentrowanego bloku pracy.',
  'End work session': 'Zakończ sesję pracy',
  'What did you get done?': 'Co udało Ci się zrobić?',
  Cancel: 'Anuluj',
  'Save session': 'Zapisz sesję',
  'Saving…': 'Zapisywanie…',
  'Add session manually': 'Dodaj sesję ręcznie',
  'Adding…': 'Dodawanie…',
  'Add session': 'Dodaj sesję',
  'Save changes': 'Zapisz zmiany',
  'Delete account': 'Usuń konto',
  'Settings and privacy': 'Ustawienia i prywatność',
  'Session split when saving': 'Podział sesji przy zapisie',
  'This prepares separate entries in the stop dialog; nothing is saved until you confirm.':
    'To przygotowuje osobne wpisy w oknie kończenia sesji; nic nie zapisze się bez Twojego potwierdzenia.',
  'Only private time and distractions (recommended)': 'Tylko prywatność i rozproszenia (zalecane)',
  'Every helper context': 'Każdy kontekst helpera',
  'Never split automatically': 'Nigdy nie dziel automatycznie',
  'Signal is treated as private time. YouTube, Instagram, Tinder, Reddit, Wykop and X are treated as distractions and count as focus losses. You can still correct every block before saving.':
    'Signal jest traktowany jako czas prywatny. YouTube, Instagram, Tinder, Reddit, Wykop i X są traktowane jako rozproszenia i liczą się jako utrata skupienia. Każdy blok możesz poprawić przed zapisaniem.',
  'Helper privacy level': 'Poziom prywatności helpera',
  'Low — store app, domain, and window title': 'Niski — zapisuj aplikację, domenę i tytuł okna',
  'Standard — mask sensitive text in window titles':
    'Standardowy — maskuj wrażliwy tekst w tytułach okien',
  'High — store app only': 'Wysoki — zapisuj tylko aplikację',
  'Private domains always hide their domain and title.':
    'Prywatne domeny zawsze ukrywają domenę i tytuł.',
  'At High privacy, browser domains are hidden, so YouTube, Instagram and similar sites cannot be identified as distractions.':
    'Przy wysokiej prywatności domeny przeglądarki są ukryte, więc YouTube, Instagram i podobne strony nie zostaną rozpoznane jako rozproszenia.',
  'Short helper fragments found': 'Znaleziono krótkie fragmenty helpera',
  'These entries share the same context and are close together. Review before merging; nothing is changed automatically.':
    'Te wpisy mają ten sam kontekst i są blisko siebie. Sprawdź je przed scaleniem; nic nie zmieni się automatycznie.',
  'Merge fragments': 'Scal fragmenty',
  'Showing the first 5 cleanup suggestions.': 'Pokazuję pierwszych 5 propozycji porządkowania.',
  Confirmation: 'Potwierdzenie',
  Close: 'Zamknij',
  Language: 'Język',
  'Return to the mode picker': 'Wróć do wyboru trybu',
  'Return to mode picker': 'Wróć do wyboru trybu',
  'Loading Private local data…': 'Wczytywanie danych prywatnych lokalnie…',
  'Private local cannot save data safely.':
    'Tryb prywatny lokalny nie może bezpiecznie zapisać danych.',
  'I will not show an empty workspace and pretend your data is being persisted.':
    'Nie pokażę pustego obszaru pracy i nie będę udawać, że dane są zapisywane.',
  'All cloud data for this account has been deleted.':
    'Wszystkie dane tego konta w chmurze zostały usunięte.',
  'Session paused after {duration} of work.': 'Sesja wstrzymana po {duration} pracy.',
  '{duration} elapsed': 'Upłynęło: {duration}',
  'Start {minutes} min': 'Start: {minutes} min',
  'Break {minutes} min': 'Przerwa: {minutes} min',
  days: 'dni',
  none: 'brak',
  'saved sessions in the database.': 'zapisanych sesji w bazie.',
  'of {sessions} loaded sessions across {days} days': 'z {sessions} wczytanych sesji z {days} dni',
  'Last 100 sessions': 'Ostatnie 100 sesji',
  'This view shows only the last 100 sessions. Full CSV export downloads your entire account history.':
    'Ten widok pokazuje tylko 100 ostatnich sesji. Pełny eksport CSV pobiera całą historię konta.',
  'This view shows only the last 100 sessions. Full CSV export downloads your entire account history: {sessions} sessions available.':
    'Ten widok pokazuje tylko 100 ostatnich sesji. Pełny eksport CSV pobiera całą historię konta: {sessions} dostępnych sesji.',
  'Show less': 'Pokaż mniej',
  'Show full timeline ({count})': 'Pokaż pełną oś czasu ({count})',
  'Hide activity': 'Ukryj aktywność',
  'Show activity ({count})': 'Pokaż aktywność ({count})',
  '{count} sessions.': '{count} sesji.',
  'Dashboard totals are based on the most recent 1,000 sessions.':
    'Sumy dashboardu bazują na 1 000 najnowszych sesjach.',
  'Deleting…': 'Usuwanie…',
  'Deleting data…': 'Usuwanie danych…',
  'Delete cloud data': 'Usuń dane z chmury',
  'Delete local data': 'Usuń dane lokalne',
  'Deleting account…': 'Usuwanie konta…',
  'Play a short sound after saving the session': 'Odtwórz krótki dźwięk po zapisaniu sesji',
  Date: 'Data',
  Start: 'Start',
  End: 'Koniec',
  'If work crosses midnight, saving will create two separate entries for the two days.':
    'Jeśli praca przechodzi przez północ, zapis utworzy dwa osobne wpisy dla obu dni.',
  'Session description': 'Opis sesji',
  'Activity for the last 14 days': 'Aktywność z ostatnich 14 dni',
  'The timer is fully manual. Nothing will stop or pause the session without your decision.':
    'Timer jest w pełni ręczny. Nic nie zatrzyma ani nie wstrzyma sesji bez Twojej decyzji.',
  'Auto-pause only reacts to activity visible in this app window. Work in Codex, Canva, or OBS may not be visible here.':
    'Auto-pauza reaguje tylko na aktywność widoczną w tym oknie aplikacji. Praca w Codex, Canvie lub OBS może nie być tu widoczna.',
  'After {minutes} minutes of inactivity in this window, the timer will pause. Pausing freezes time; it does not reset the session.':
    'Po {minutes} minutach bezczynności w tym oknie timer zostanie wstrzymany. Wstrzymanie zatrzymuje czas, ale nie resetuje sesji.',
  'This browser does not support system notifications.':
    'Ta przeglądarka nie obsługuje powiadomień systemowych.',
  'Notifications are blocked. The timer still works, but you will only see cycle completion in the app.':
    'Powiadomienia są zablokowane. Timer nadal działa, ale zakończenie cyklu zobaczysz tylko w aplikacji.',
  'Notifications are enabled for cycle completion.':
    'Powiadomienia o zakończeniu cyklu są włączone.',
  'Enable notifications to get a Pomodoro completion signal.':
    'Włącz powiadomienia, aby otrzymywać sygnał zakończenia Pomodoro.',
  'Last signal {seconds}s ago.': 'Ostatni sygnał: {seconds} s temu.',
  'Last signal {minutes} min ago.': 'Ostatni sygnał: {minutes} min temu.',
  'In advanced mode, the helper can watch for silence outside this window, but helper auto-pause is currently off.':
    'W trybie zaawansowanym helper może wykrywać ciszę poza tym oknem, ale auto-pauza helpera jest obecnie wyłączona.',
  'The helper tracks the active app outside this window. If its last heartbeat goes quiet longer than the threshold, the session will pause.':
    'Helper śledzi aktywną aplikację poza tym oknem. Jeśli jego ostatni sygnał ucichnie na dłużej niż ustawiony próg, sesja zostanie wstrzymana.',
  'Automatic activity detection': 'Automatyczne wykrywanie aktywności',
  'Helper connected': 'Helper połączony',
  'Mac and Windows share one session': 'Mac i Windows korzystają z jednej sesji',
  Collapse: 'Zwiń',
  Expand: 'Rozwiń',
  'Desktop helper setup': 'Konfiguracja desktopowego helpera',
  'Desktop helper': 'Desktopowy helper',
  'Generating a secure key… keep this page open.':
    'Generowanie bezpiecznego klucza… zostaw tę stronę otwartą.',
  'Key ready. Download one starter for each computer and run it next to your timer.':
    'Klucz gotowy. Pobierz starter dla każdego komputera i uruchom go obok timera.',
  'Generate one key first. It connects the helper on your Mac or Windows computer to this account.':
    'Najpierw wygeneruj klucz. Połączy on helpera na komputerze Mac lub Windows z tym kontem.',
  'Generating…': 'Generowanie…',
  'Generate new key': 'Wygeneruj nowy klucz',
  'Generate helper key': 'Wygeneruj klucz helpera',
  'Revoke every desktop helper key for this account?':
    'Unieważnić wszystkie klucze desktopowego helpera dla tego konta?',
  'Revoke all keys': 'Unieważnij wszystkie klucze',
  'Step 1 · key': 'Krok 1 · klucz',
  'Generating key…': 'Generowanie klucza…',
  'Key generated': 'Klucz wygenerowany',
  'Generate your key': 'Wygeneruj swój klucz',
  'This key is included in the starter downloads below.':
    'Ten klucz znajduje się w poniższych starterach do pobrania.',
  'Nothing is downloaded until you click the button above.':
    'Nic nie zostanie pobrane, dopóki nie klikniesz przycisku powyżej.',
  'Helper key': 'Klucz helpera',
  Status: 'Status',
  'Last activity': 'Ostatnia aktywność',
  'No window title.': 'Brak tytułu okna.',
  'Sugestia projektu': 'Sugestia projektu',
  'No active project suggestion from the helper.': 'Brak aktywnej sugestii projektu od helpera.',
  'Save rule changes': 'Zapisz zmiany reguły',
  'Save a rule from this activity': 'Zapisz regułę z tej aktywności',
  'Cancel editing': 'Anuluj edycję',
  Edit: 'Edytuj',
  Delete: 'Usuń',
  'Category from project history': 'Kategoria z historii projektu',
  'Automatic activity capture stays here. The rest of the helper settings are under Advanced.':
    'Automatyczny zapis aktywności jest tutaj. Pozostałe ustawienia helpera znajdziesz w sekcji Zaawansowane.',
  'Automatic activity capture': 'Automatyczny zapis aktywności',
  'Step 2 · download': 'Krok 2 · pobierz',
  'The helper detects the active app and window title outside worktimer. You do not need a local copy of the repository.':
    'Helper automatycznie wykrywa aktywną aplikację i tytuł okna poza Worktimerem. Nie potrzebujesz lokalnej kopii repozytorium.',
  'Each computer gets its own starter and key. The helper sees the foreground app; a recorder running only in the background does not replace the active context.':
    'Każdy komputer otrzymuje własny starter i klucz. Helper widzi aplikację na pierwszym planie; program działający wyłącznie w tle nie zastępuje aktywnego kontekstu.',
  'Download Mac starter': 'Pobierz starter dla Maca',
  'Download Windows starter': 'Pobierz starter dla Windows',
  'The starter includes the current helper key.': 'Starter zawiera bieżący klucz helpera.',
  'Generate a helper key first to download a ready-to-run starter.':
    'Najpierw wygeneruj klucz helpera, aby pobrać gotowy starter.',
  'The helper sends the active app and window title to {url}.':
    'Helper wysyła aktywną aplikację i tytuł okna do {url}.',
  'No helper ingest URL is configured.': 'Nie skonfigurowano adresu ingest helpera.',
  'Step 3 · run': 'Krok 3 · uruchom',
  'Start the helper beside your timer': 'Uruchom helper obok timera',
  'Run this command after downloading the starter. Keep the helper window running while you work.':
    'Uruchom to polecenie po pobraniu startera. Pozostaw okno helpera włączone podczas pracy.',
  'Helper tracking is off.': 'Śledzenie helpera jest wyłączone.',
  'Helper tracking is temporarily paused.': 'Śledzenie helpera jest tymczasowo wstrzymane.',
  'Helper tracking is on. Private domains masked: {count}.':
    'Śledzenie helpera działa. Ukryte prywatne domeny: {count}.',
  'Helper tracking is on. No private domains are configured.':
    'Śledzenie helpera działa. Nie skonfigurowano prywatnych domen.',
  'Start from helper': 'Uruchom z helpera',
  'Hide advanced settings': 'Ukryj ustawienia zaawansowane',
  'Show advanced settings': 'Pokaż ustawienia zaawansowane',
  '{count} samples grouped': '{count} próbek połączonych',
  'No helper history yet. After you start it, recent work contexts will appear here.':
    'Brak historii helpera. Po uruchomieniu pojawią się tu ostatnie konteksty pracy.',
  'Helper tracking: on': 'Śledzenie helpera: włączone',
  'Helper tracking: off': 'Śledzenie helpera: wyłączone',
  'Pause for {minutes} min': 'Wstrzymaj na {minutes} min',
  'Pause until resumed': 'Wstrzymaj do wznowienia',
  'Resume helper': 'Wznów helpera',
  'Private domains, one per line': 'Prywatne domeny, po jednej w wierszu',
  'Save private domains': 'Zapisz prywatne domeny',
  'Rule project being edited': 'Edytowany projekt reguły',
  'Project for helper activity': 'Projekt dla aktywności helpera',
  'Suggested work category': 'Sugerowana kategoria pracy',
  'Infer from this project history': 'Wnioskuj na podstawie historii tego projektu',
  'Activity type': 'Typ aktywności',
  'Work (unless another rule says otherwise)': 'Praca (chyba że inna reguła mówi inaczej)',
};

function translatePolish(key: string) {
  const direct = polish[key];
  if (direct) return direct;
  for (const [source, target] of Object.entries(polish)) {
    const placeholders = source.match(/\{[^}]+\}/g);
    if (!placeholders) continue;
    const parts = source.split(/\{[^}]+\}/g);
    const regexSpecialCharacters = '.*+?^$()|[]{}' + String.fromCharCode(92);
    const escapeRegex = (value: string) =>
      value
        .split('')
        .map((character) =>
          regexSpecialCharacters.includes(character)
            ? String.fromCharCode(92) + character
            : character,
        )
        .join('');
    const pattern = new RegExp(
      `^${parts.map((part, index) => `${escapeRegex(part)}${index < placeholders.length ? '(.+?)' : ''}`).join('')}$`,
    );
    const match = key.match(pattern);
    if (!match) continue;
    return placeholders.reduce(
      (translated, placeholder, index) => translated.replace(placeholder, match[index + 1] ?? ''),
      target,
    );
  }
  return key;
}

export function readStoredLanguage(storage: Pick<Storage, 'getItem'> | null | undefined): Language {
  return storage?.getItem(languageStorageKey) === 'pl' ? 'pl' : 'en';
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => undefined,
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      return readStoredLanguage(window.localStorage);
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem(languageStorageKey, language);
    } catch {
      // The UI still works when storage is unavailable.
    }
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key) => (language === 'pl' ? translatePolish(key) : key),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguagePicker() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="language-picker" aria-label={t('Language')} role="group">
      <button
        aria-pressed={language === 'pl'}
        className={`chip-btn ${language === 'pl' ? 'is-active' : ''}`}
        onClick={() => setLanguage('pl')}
        type="button"
      >
        PL
      </button>
      <button
        aria-pressed={language === 'en'}
        className={`chip-btn ${language === 'en' ? 'is-active' : ''}`}
        onClick={() => setLanguage('en')}
        type="button"
      >
        EN
      </button>
    </div>
  );
}

export function translate(key: string, language: Language = 'en') {
  return language === 'pl' ? translatePolish(key) : key;
}
