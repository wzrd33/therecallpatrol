'use client';

const fmtDay = (d: Date) => {
  const today = new Date();
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'earlier today';
  if (d.toDateString() === y.toDateString()) return 'yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

export function PatrolReport({ ready, firstVisit, newCount, lastVisit, streak, nickname, homeCount, homeAlerts }: {
  ready: boolean;
  firstVisit: boolean;
  newCount: number;
  lastVisit: Date | null;
  streak: number;
  nickname: string;
  homeCount: number;
  homeAlerts: number;
}) {
  if (!ready) return <div className="patrol-report h-[68px] animate-pulse" aria-hidden="true" />;

  const since = lastVisit ? `since ${fmtDay(lastVisit)}` : 'since your last visit';

  return (
    <div className="patrol-report" role="status">
      <div className="patrol-stat">
        <span className="patrol-num">{streak}</span>
        <span className="patrol-label">
          {streak === 1 ? 'Day on patrol' : 'Days on patrol'}
          <span className="patrol-sub">{nickname ? `Welcome back, ${nickname}` : firstVisit ? 'Welcome to the patrol' : 'Good to see you again'}</span>
        </span>
      </div>
      <a href="#now-recalled" className="patrol-stat">
        <span className="patrol-num" data-tone={newCount > 0 ? 'new' : undefined}>{firstVisit ? '•' : newCount}</span>
        <span className="patrol-label">
          {firstVisit ? 'Fresh recalls' : newCount === 1 ? 'New recall' : 'New recalls'}
          <span className="patrol-sub">{firstVisit ? 'Scout will flag new ones next time' : newCount > 0 ? since : `Nothing new ${since}`}</span>
        </span>
      </a>
      <a href="#my-home" className="patrol-stat">
        <span className="patrol-num" data-tone={homeAlerts > 0 ? 'alert' : undefined}>
          {homeCount === 0 ? '+' : homeAlerts > 0 ? homeAlerts : '0'}
        </span>
        <span className="patrol-label">
          {homeCount === 0 ? 'My Home' : homeAlerts > 0 ? (homeAlerts === 1 ? 'Thing to check' : 'Things to check') : 'No matches found'}
          <span className="patrol-sub">
            {homeCount === 0 ? 'Add what you own' : `Scout checked ${homeCount} of your ${homeCount === 1 ? 'thing' : 'things'}`}
          </span>
        </span>
      </a>
    </div>
  );
}
