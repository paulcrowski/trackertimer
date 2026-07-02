import { useEffect, useMemo, useState } from 'react';
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react';
import { anyApi } from 'convex/server';
import { useMutation, useQuery } from 'convex/react';

const categories = ['materiały', 'kodowanie', 'aplikacja klubowa', 'Patronite', 'komunikacja', 'nagrania', 'research', 'UX', 'administracja', 'inne'];
type Session = { _id: string; date: string; startTime: string; stopTime: string; duration: number; category: string; description: string; whatIsDone: string };
type ActiveSession = { startTime: number; category: string; description: string };
type TrackerData = { user: { name?: string; email?: string; image?: string } | null; activeSession: ActiveSession | null; sessions: Session[] };
const hms = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((v) => String(v).padStart(2, '0')).join(':');
const pretty = (s: number) => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
const sameDay = (d: string) => d === new Date().toISOString().slice(0, 10);
const label = (d: string) => new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium' }).format(new Date(d));
const message = (error: unknown) => error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd.';

export default function App() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const data = useQuery(anyApi.tracker.bootstrap, isAuthenticated ? {} : 'skip') as TrackerData | undefined;
  const start = useMutation(anyApi.tracker.start);
  const stop = useMutation(anyApi.tracker.stop);
  const [category, setCategory] = useState(categories[1]);
  const [description, setDescription] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.activeSession) return setElapsed(0);
    const tick = () => setElapsed(Math.floor((Date.now() - data.activeSession!.startTime) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [data?.activeSession]);

  const stats = useMemo(() => {
    const sessions = data?.sessions ?? [];
    return { today: sessions.filter((s) => sameDay(s.date)).reduce((sum, s) => sum + s.duration, 0), total: sessions.reduce((sum, s) => sum + s.duration, 0) };
  }, [data?.sessions]);

  if (isLoading) return <div className="app-container"><section className="timer-card"><div className="stat-label">Łączenie z Convex…</div></section></div>;
  if (!isAuthenticated) return <div className="app-container"><section className="timer-card"><h1>Poprostu<span>Koduj</span> Time Tracker</h1><p style={{ color: 'var(--color-text-secondary)', maxWidth: 520 }}>Zaloguj się przez Google, aby mieć własny rejestr czasu pracy dostępny z różnych urządzeń. Stare wpisy z localStorage nie są migrowane.</p><button className="btn btn-start" onClick={() => void signIn('google').catch((e) => setError(message(e)))}>Zaloguj przez Google</button>{error ? <div style={{ color: 'var(--color-red)' }}>{error}</div> : null}</section></div>;
  if (!data) return <div className="app-container"><section className="timer-card"><div className="stat-label">Ładowanie danych…</div></section></div>;

  const active = data.activeSession;
  return (
    <div className="app-container">
      <header id="header-section"><div className="logo-group"><div className="logo-dot"></div><h1>Poprostu<span>Koduj</span> Time Tracker</h1></div><div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}><div className="status-badge"><div className={`status-dot ${active ? 'active' : 'paused'}`}></div><span>{active ? 'Pracuję' : 'Pauza'}</span></div><div className="status-badge"><span>{data.user?.name ?? data.user?.email ?? 'Użytkownik'}</span></div><button className="btn-small" onClick={() => void signOut().catch((e) => setError(message(e)))}>Wyloguj</button></div></header>
      <section className="timer-card">
        <div className="timer-display">{active ? hms(elapsed) : '00:00:00'}</div>
        <div className="session-setup" style={{ width: '100%' }}>
          <div className="form-group"><label htmlFor="category">Kategoria pracy</label><select id="category" value={category} disabled={!!active} onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
          <div className="form-group"><label htmlFor="description">{active ? 'Aktywna sesja' : 'Co robisz?'}</label><input id="description" value={active ? active.description : description} disabled={!!active} onChange={(e) => setDescription(e.target.value)} placeholder="Wpisz krótki opis zadania..." /></div>
        </div>
        <div className="controls-group">{active ? <button className="btn btn-stop" onClick={() => void stop({ whatIsDone: window.prompt('Co zrobiono?', active.description) ?? undefined }).catch((e) => setError(message(e)))}>STOP</button> : <button className="btn btn-start" onClick={() => void start({ category, description }).then(() => setDescription('')).catch((e) => setError(message(e)))}>START</button>}</div>
        {error ? <div style={{ color: 'var(--color-red)' }}>{error}</div> : null}
      </section>
      <section className="stats-grid"><div className="stat-card"><div className="stat-label">Dzisiaj</div><div className="stat-val">{pretty(stats.today)}</div></div><div className="stat-card"><div className="stat-label">Łącznie</div><div className="stat-val">{pretty(stats.total)}</div></div><div className="stat-card"><div className="stat-label">Sesje</div><div className="stat-val">{data.sessions.length}</div></div></section>
      <section className="list-section"><div className="section-header"><div className="section-title">Ostatnie sesje pracy</div></div><div className="table-container"><table><thead><tr><th>Data</th><th>Kategoria</th><th>Czas</th><th>Opis</th><th>Notatka</th></tr></thead><tbody>{data.sessions.map((session) => <tr key={session._id}><td><div>{label(session.date)}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{session.startTime} - {session.stopTime}</div></td><td><span className="category-pill">{session.category}</span></td><td>{hms(session.duration)}</td><td>{session.description}</td><td>{session.whatIsDone}</td></tr>)}</tbody></table>{!data.sessions.length ? <div id="no-data-msg" style={{ display: 'block' }}>Brak sesji dla tego konta.</div> : null}</div></section>
    </div>
  );
}
