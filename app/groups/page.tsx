type ChecklistTask = {
  title: string;
  status: 'done' | 'pending';
  detail: string;
  highlighted?: boolean;
};

const tasks: ChecklistTask[] = [
  { title: 'Create event', status: 'done', detail: 'Completed Oct 01' },
  { title: 'Open restaurant vote', status: 'done', detail: 'Completed Oct 05' },
  { title: 'Close vote and confirm venue', status: 'done', detail: 'Completed Oct 12' },
  { title: 'Send final reminder', status: 'pending', detail: 'Due tomorrow', highlighted: true },
  { title: 'Close event and log restaurant', status: 'pending', detail: 'Scheduled for Oct 28' },
] as const;

export default function GroupsPage() {
  return (
    <main className="dashboard-page">
      <header className="topbar">
        <div className="topbar__brand">monthly-dinner</div>
        <nav className="topbar__nav" aria-label="Primary">
          <a className="topbar__link" href="/dashboard">
            Home
          </a>
          <a className="topbar__link topbar__link--active" href="/groups">
            History
          </a>
          <a className="topbar__link" href="/dashboard#profile">
            Profile
          </a>
        </nav>
        <div className="topbar__actions" aria-hidden="true">
          <span className="topbar__icon">🔔</span>
          <span className="topbar__avatar">•</span>
        </div>
      </header>

      <section className="checklist-shell">
        <div className="checklist-hero">
          <div>
            <p className="eyebrow">Monthly curator duties</p>
            <h1>Organizer Checklist</h1>
            <p className="checklist-hero__subtitle">October Dinner: The Autumn Harvest Table</p>
          </div>
          <div className="checklist-progress">
            <div className="checklist-progress__ring">60%</div>
            <div>
              <p>Progress</p>
              <strong>3 of 5 Completed</strong>
            </div>
          </div>
        </div>

        <div className="checklist-list">
          {tasks.map((task) => (
            <article
              key={task.title}
              className={`checklist-item ${task.highlighted ? 'checklist-item--highlighted' : ''}`}
            >
              <div className={`checklist-item__status checklist-item__status--${task.status}`}>
                {task.status === 'done' ? '✓' : '○'}
              </div>
              <div className="checklist-item__content">
                <h2>{task.title}</h2>
                <div className="checklist-meta">
                  <span className={`pill ${task.status === 'done' ? 'pill--success' : 'pill--pending'}`}>
                    {task.status}
                  </span>
                  <p>{task.detail}</p>
                </div>
              </div>
              <div className="checklist-item__action">
                {task.status === 'done' ? (
                  <span className="checkmark-badge">✓</span>
                ) : task.highlighted ? (
                  <button className="primary-chip">Action</button>
                ) : (
                  <span className="pending-badge">⌛</span>
                )}
              </div>
            </article>
          ))}
        </div>

        <blockquote className="checklist-quote">
          “A well-curated evening starts with thoughtful organization.”
        </blockquote>
      </section>
    </main>
  );
}
