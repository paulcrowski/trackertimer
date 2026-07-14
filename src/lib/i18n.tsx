import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'en' | 'pl';

const languageStorageKey = 'worktimer.language';

const polish: Record<string, string> = {
  'Choose how to work.': 'Wybierz sposób pracy.',
  'Sync to the cloud or keep everything private on this device.': 'Synchronizuj z chmurą albo zachowaj wszystko prywatnie na tym urządzeniu.',
  'Cloud sync keeps your Google sign-in and data in Convex. Private local keeps your timer data only in this browser on this device.': 'Synchronizacja w chmurze przechowuje logowanie Google i dane w Convex. Tryb prywatny lokalny trzyma dane timera tylko w tej przeglądarce na tym urządzeniu.',
  'Cloud sync + Google': 'Synchronizacja w chmurze + Google',
  'Private local': 'Prywatnie lokalnie',
  'Cloud sync requires `VITE_CONVEX_URL` in this environment. Private local works without this configuration.': 'Synchronizacja w chmurze wymaga w tym środowisku `VITE_CONVEX_URL`. Tryb prywatny lokalny działa bez tej konfiguracji.',
  'Private local requires local `IndexedDB` storage, so work data cannot be safely persisted in this environment.': 'Tryb prywatny lokalny wymaga lokalnego storage `IndexedDB`, więc dane pracy nie mogą być bezpiecznie zapisane w tym środowisku.',
  'Two storage modes': 'Dwa tryby przechowywania',
  'Cloud sync: one account across devices.': 'Synchronizacja w chmurze: jedno konto na wielu urządzeniach.',
  'Private local: no tracker queries or mutations reach Convex.': 'Prywatnie lokalnie: żadne zapytania ani zmiany trackera nie trafiają do Convex.',
  'You can switch modes later without removing your Google sign-in.': 'Możesz później zmienić tryb bez usuwania logowania Google.',
  'Get straight into your work rhythm.': 'Wejdź od razu w rytm pracy.',
  'Keep your focus in one clear rhythm.': 'Utrzymaj skupienie w jednym, przejrzystym rytmie.',
  'Session history, work trends, manual corrections, and your preferences in one source of truth on Convex.': 'Historia sesji, trendy pracy, ręczne poprawki i preferencje w jednym źródle prawdy w Convex.',
  'Sign in with Google': 'Zaloguj przez Google',
  'The same account works across devices.': 'To samo konto działa na wielu urządzeniach.',
  'Ready-to-use workspace': 'Gotowy obszar pracy',
  'Live timer with manual stop and optional auto-pause.': 'Timer z ręcznym stopem i opcjonalną auto-pauzą.',
  'Manual add, edit, delete, and CSV export.': 'Ręczne dodawanie, edycja, usuwanie i eksport CSV.',
  'Category breakdown and a 30-day trend in a lightweight UI.': 'Podział na kategorie i trend z 30 dni w lekkim interfejsie.',
  'Time tracker': 'Timer pracy',
  'Settings': 'Ustawienia',
  'Turn on focus mode': 'Włącz tryb skupienia',
  'Turn off focus mode': 'Wyłącz tryb skupienia',
  'PWA installed': 'PWA zainstalowana',
  'Install app': 'Zainstaluj aplikację',
  'Working': 'Praca',
  'Paused': 'Wstrzymany',
  'Google account': 'Konto Google',
  'Dismiss': 'Ukryj',
  'Recover the restored local session.': 'Odzyskaj przywróconą sesję lokalną.',
  'Save manually': 'Zapisz ręcznie',
  'Discard recovery': 'Odrzuć odzyskiwanie',
  'Tracking mode': 'Tryb śledzenia',
  'Automatic helper': 'Automatyczny helper',
  'Basic timer': 'Podstawowy timer',
  'Basic': 'Podstawowy',
  'Auto': 'Auto',
  'Auto requires Cloud sync. Basic works locally on this device.': 'Auto wymaga synchronizacji w chmurze. Tryb podstawowy działa lokalnie na tym urządzeniu.',
  'Active session': 'Aktywna sesja',
  'Start the timer when you begin a focused piece of work.': 'Uruchom timer, gdy zaczynasz skoncentrowany blok pracy.',
  'Work category': 'Kategoria pracy',
  'Project': 'Projekt',
  'What are you working on?': 'Nad czym pracujesz?',
  'Enter a short task description...': 'Wpisz krótki opis zadania…',
  'Resume': 'Wznów',
  'START': 'START',
  'STOP': 'STOP',
  'You stop the timer manually; Pomodoro only provides a signal.': 'Timer zatrzymujesz ręcznie; Pomodoro daje tylko sygnał.',
  'Auto-pause: on': 'Auto-pauza: włączona',
  'Auto-pause: off': 'Auto-pauza: wyłączona',
  'Helper auto-pause: on': 'Auto-pauza helpera: włączona',
  'Helper auto-pause: off': 'Auto-pauza helpera: wyłączona',
  'Inactivity': 'Bezczynność',
  'Helper silence': 'Cisza helpera',
  'min': 'min',
  'Auto-paused after inactivity.': 'Wstrzymano automatycznie po bezczynności.',
  'Pomodoro': 'Pomodoro',
  'A focus and break cycle without another app': 'Cykl skupienia i przerwy bez dodatkowej aplikacji',
  'Focus': 'Skupienie',
  'Break': 'Przerwa',
  'Cycle running': 'Cykl działa',
  'Cycle complete': 'Cykl zakończony',
  'Ready to start': 'Gotowe do startu',
  'Reset': 'Resetuj',
  'System notifications on': 'Powiadomienia systemowe włączone',
  'Notifications blocked': 'Powiadomienia zablokowane',
  'Notification API not supported': 'API powiadomień nie jest obsługiwane',
  'Notifications are waiting for permission': 'Powiadomienia czekają na zgodę',
  'Enable notifications': 'Włącz powiadomienia',
  'Work dashboard': 'Dashboard pracy',
  'Daily pace, streaks, and your strongest session signals': 'Dzienne tempo, serie i najmocniejsze sygnały z sesji',
  'Daily goal': 'Dzienny cel',
  'Today': 'Dzisiaj',
  'Progress:': 'Postęp:',
  'Remaining:': 'Pozostało:',
  'This week': 'Ten tydzień',
  'Measured from Monday in your local time.': 'Liczone od poniedziałku w Twoim czasie lokalnym.',
  'This month': 'Ten miesiąc',
  'Useful for tracking your publishing and deep-work pace.': 'Przydatne do śledzenia tempa publikowania i głębokiej pracy.',
  'Current streak': 'Aktualna seria',
  'Consecutive days with at least one saved session.': 'Kolejne dni z co najmniej jedną zapisaną sesją.',
  'Average session': 'Średnia sesja',
  'Calculated from all saved work sessions.': 'Obliczone ze wszystkich zapisanych sesji pracy.',
  'Best day': 'Najlepszy dzień',
  'It will appear after your first saved session.': 'Pojawi się po zapisaniu pierwszej sesji.',
  'Top project': 'Najważniejszy projekt',
  'Assign a session to a project to see a separate total.': 'Przypisz sesję do projektu, aby zobaczyć osobną sumę.',
  'Total': 'Łącznie',
  'Last 14 days': 'Ostatnie 14 dni',
  'Work rhythm, day by day': 'Rytm pracy dzień po dniu',
  'sessions': 'sesji',
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
  'Search': 'Szukaj',
  'description, note, category...': 'opis, notatka, kategoria…',
  'Category': 'Kategoria',
  'All': 'Wszystkie',
  'Edit session': 'Edytuj sesję',
  'Delete session': 'Usuń sesję',
  'No sessions match these filters. Clear the search or choose a different category.': 'Żadna sesja nie pasuje do filtrów. Wyczyść wyszukiwanie albo wybierz inną kategorię.',
  'No saved sessions for this account yet. Start by entering a focused block of work.': 'To konto nie ma jeszcze zapisanych sesji. Zacznij od wpisania skoncentrowanego bloku pracy.',
  'End work session': 'Zakończ sesję pracy',
  'What did you get done?': 'Co udało Ci się zrobić?',
  'Cancel': 'Anuluj',
  'Save session': 'Zapisz sesję',
  'Saving…': 'Zapisywanie…',
  'Add session manually': 'Dodaj sesję ręcznie',
  'Adding…': 'Dodawanie…',
  'Add session': 'Dodaj sesję',
  'Save changes': 'Zapisz zmiany',
  'Delete account': 'Usuń konto',
  'Settings and privacy': 'Ustawienia i prywatność',
  'Confirmation': 'Potwierdzenie',
  'Close': 'Zamknij',
  'Language': 'Język',
  'Return to the mode picker': 'Wróć do wyboru trybu',
  'Return to mode picker': 'Wróć do wyboru trybu',
  'Loading Private local data…': 'Wczytywanie danych prywatnych lokalnie…',
  'Private local cannot save data safely.': 'Tryb prywatny lokalny nie może bezpiecznie zapisać danych.',
  'I will not show an empty workspace and pretend your data is being persisted.': 'Nie pokażę pustego obszaru pracy i nie będę udawać, że dane są zapisywane.',
  'All cloud data for this account has been deleted.': 'Wszystkie dane tego konta w chmurze zostały usunięte.',
  'Session paused after {duration} of work.': 'Sesja wstrzymana po {duration} pracy.',
  '{duration} elapsed': 'Upłynęło: {duration}',
  'Start {minutes} min': 'Start: {minutes} min',
  'Break {minutes} min': 'Przerwa: {minutes} min',
  'days': 'dni',
  'none': 'brak',
  'saved sessions in the database.': 'zapisanych sesji w bazie.',
  'of {sessions} loaded sessions across {days} days': 'z {sessions} wczytanych sesji z {days} dni',
  'Last 100 sessions': 'Ostatnie 100 sesji',
  'Deleting…': 'Usuwanie…',
  'Deleting data…': 'Usuwanie danych…',
  'Delete cloud data': 'Usuń dane z chmury',
  'Delete local data': 'Usuń dane lokalne',
  'Deleting account…': 'Usuwanie konta…',
  'Play a short sound after saving the session': 'Odtwórz krótki dźwięk po zapisaniu sesji',
  'Date': 'Data',
  'Start': 'Start',
  'End': 'Koniec',
  'If work crosses midnight, saving will create two separate entries for the two days.': 'Jeśli praca przechodzi przez północ, zapis utworzy dwa osobne wpisy dla obu dni.',
  'Session description': 'Opis sesji',
  'Activity for the last 14 days': 'Aktywność z ostatnich 14 dni',
  'The timer is fully manual. Nothing will stop or pause the session without your decision.': 'Timer jest w pełni ręczny. Nic nie zatrzyma ani nie wstrzyma sesji bez Twojej decyzji.',
  'Auto-pause only reacts to activity visible in this app window. Work in Codex, Canva, or OBS may not be visible here.': 'Auto-pauza reaguje tylko na aktywność widoczną w tym oknie aplikacji. Praca w Codex, Canvie lub OBS może nie być tu widoczna.',
  'After {minutes} minutes of inactivity in this window, the timer will pause. Pausing freezes time; it does not reset the session.': 'Po {minutes} minutach bezczynności w tym oknie timer zostanie wstrzymany. Wstrzymanie zatrzymuje czas, ale nie resetuje sesji.',
  'This browser does not support system notifications.': 'Ta przeglądarka nie obsługuje powiadomień systemowych.',
  'Notifications are blocked. The timer still works, but you will only see cycle completion in the app.': 'Powiadomienia są zablokowane. Timer nadal działa, ale zakończenie cyklu zobaczysz tylko w aplikacji.',
  'Notifications are enabled for cycle completion.': 'Powiadomienia o zakończeniu cyklu są włączone.',
  'Enable notifications to get a Pomodoro completion signal.': 'Włącz powiadomienia, aby otrzymywać sygnał zakończenia Pomodoro.',
};

function translatePolish(key: string) {
  const direct = polish[key];
  if (direct) return direct;
  for (const [source, target] of Object.entries(polish)) {
    const placeholders = source.match(/\{[^}]+\}/g);
    if (!placeholders) continue;
    const parts = source.split(/\{[^}]+\}/g);
    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${parts.map((part, index) => `${escapeRegex(part)}${index < placeholders.length ? '(.+?)' : ''}`).join('')}$`);
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
