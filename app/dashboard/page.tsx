const attendanceHistory = [
  { month: 'JUL', status: 'check' },
  { month: 'AGO', status: 'check' },
  { month: 'SEP', status: 'check' },
  { month: 'OCT', status: 'check' },
  { month: 'NOV', status: 'check' },
  { month: 'DIC', status: 'check' },
  { month: 'ENE', status: 'dash' },
  { month: 'FEB', status: 'check' },
  { month: 'MAR', status: 'check' },
] as const;

const leaderboard = [
  { name: 'Joaquin', score: 8, total: 8 },
  { name: 'Guido', score: 6, total: 8 },
  { name: 'Martín', score: 5, total: 8 },
  { name: 'Gustavo', score: 8, total: 8 },
  { name: 'Huevo', score: 5, total: 8 },
  { name: 'Germán', score: 4, total: 8 },
];

const guests = {
  confirmed: [
    { initials: 'SJ', name: 'Sarah J.', note: '“Wine ready!”' },
    { initials: 'MC', name: 'Marcus C.', note: '+1 guest' },
    { initials: 'AP', name: 'Alicia P.', note: 'Vegetarian menu' },
  ],
  noResponse: [
    { initials: 'DW', name: 'David W.' },
    { initials: 'RJ', name: 'Rebecca J.' },
  ],
  declined: [{ initials: 'ET', name: 'Emma T.', note: 'Away' }],
};

const todos = [
  { label: 'Invite blast to historical attendees', done: true },
  { label: 'Finalize restaurant booking with deposit', done: false },
];

export default function DashboardPage() {
  return (
    <main className="dashboard-page">
      <header className="topbar">
        <div className="topbar__brand">monthly-dinner</div>
        <nav className="topbar__nav" aria-label="Primary">
          <a className="topbar__link topbar__link--active" href="/dashboard">
            Home
          </a>
          <a className="topbar__link" href="/groups">
            History
          </a>
          <a className="topbar__link" href="/dashboard#profile">
            Profile
          </a>
        </nav>
        <div className="topbar__actions" aria-hidden="true">
          <span className="topbar__icon">🔔</span>
          <span className="topbar__icon">⚙️</span>
          <span className="topbar__avatar">•</span>
        </div>
      </header>

      <section className="dashboard-shell">
        <div className="dashboard-banner">
          <div className="dashboard-banner__context">
            <span className="pill pill--blue">Admin view</span>
            <p>Organizing: June Solstice Supper</p>
          </div>
          <div className="dashboard-banner__actions">
            <button className="text-button">Share summary</button>
            <button className="primary-chip">Edit Event</button>
          </div>
        </div>

        <section className="hero-event">
          <div>
            <h1>June Solstice Supper</h1>
            <p className="hero-event__meta">Saturday, June 22 • West Village, NY</p>
          </div>
          <div className="hero-stats">
            <div className="stat-card">
              <strong>14</strong>
              <span>Attending</span>
            </div>
            <div className="stat-card">
              <strong>22</strong>
              <span>Invited</span>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <p>Monthly attendance history</p>
          </div>
          <div className="history-grid">
            {attendanceHistory.map((item) => (
              <div key={item.month} className={`history-card ${item.status === 'dash' ? 'history-card--muted' : ''}`}>
                <span>{item.month}</span>
                <strong>{item.status === 'check' ? '✓' : '—'}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <p>Attendance leaderboard</p>
          </div>
          <div className="leaderboard-card">
            {leaderboard.map((person) => (
              <article key={person.name} className="leaderboard-item">
                <div className="leaderboard-item__header">
                  <span>{person.name}</span>
                  <span>
                    {person.score}/{person.total}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-track__fill"
                    style={{ width: `${(person.score / person.total) * 100}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <p>Event logistics & guests</p>
          </div>
          <div className="logistics-grid">
            <article className="logistics-panel venue-panel">
              <h3>Venue strategy</h3>
              <div className="venue-card">
                <div className="venue-card__image">
                  <div>
                    <span>Top voted</span>
                    <strong>L&apos;Artusi Italian Bistro</strong>
                  </div>
                </div>
                <div className="venue-card__details">
                  <div>
                    <span>Status</span>
                    <strong>● 8:30 PM</strong>
                  </div>
                  <div>
                    <span>Budget</span>
                    <strong>$65 - $80 pp</strong>
                  </div>
                </div>
              </div>
            </article>

            <article className="logistics-panel guest-panel">
              <h3>Confirmed (14)</h3>
              <ul>
                {guests.confirmed.map((guest) => (
                  <li key={guest.name}>
                    <span className="guest-avatar">{guest.initials}</span>
                    <div>
                      <strong>{guest.name}</strong>
                      <p>{guest.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <button className="secondary-outline">View all</button>
            </article>

            <article className="logistics-panel guest-panel">
              <h3>No response (5)</h3>
              <ul>
                {guests.noResponse.map((guest) => (
                  <li key={guest.name}>
                    <span className="guest-avatar guest-avatar--muted">{guest.initials}</span>
                    <div>
                      <strong>{guest.name}</strong>
                    </div>
                    <button className="mini-action">Nudge</button>
                  </li>
                ))}
              </ul>
            </article>

            <article className="logistics-panel guest-panel guest-panel--declined">
              <h3>Declined (3)</h3>
              <ul>
                {guests.declined.map((guest) => (
                  <li key={guest.name}>
                    <span className="guest-avatar guest-avatar--danger">{guest.initials}</span>
                    <div>
                      <strong>{guest.name}</strong>
                      <p>{guest.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="notes-grid">
          <article className="notes-card">
            <h3>Internal Notes</h3>
            <div className="note-callout">
              <span>Attention required</span>
              <p>
                “Check Sarah&apos;s +1 status by Wednesday. The restaurant needs a final headcount for the private
                room by then.”
              </p>
            </div>
          </article>

          <article className="notes-card">
            <h3>To-Do</h3>
            <div className="todo-list">
              {todos.map((todo) => (
                <label key={todo.label} className="todo-item">
                  <input type="checkbox" defaultChecked={todo.done} />
                  <span>{todo.label}</span>
                </label>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
