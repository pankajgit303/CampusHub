import { Component, type ReactNode } from 'react';
import { Inbox, GraduationCap, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Logo() {
  return (
    <Link to="/" className="logo">
      <span className="logo-mark">
        <GraduationCap size={25} />
      </span>
      <span>
        Campus<span className="logo-light">Hub</span>
        <small>CONNECTED CAMPUS</small>
      </span>
    </Link>
  );
}
export function Loading() {
  return (
    <div className="skeleton-grid" aria-label="Loading" role="status">
      {[1, 2, 3, 4].map((i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function Empty({
  title = 'Nothing here yet',
  text = 'New updates will appear here when they are published.',
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <span>
        <Inbox size={28} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow || 'YOUR CAMPUS, CONNECTED'}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function SectionTitle({ title, to }: { title: string; to?: string }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {to && (
        <Link to={to}>
          View all <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="error-page">
        <h1>Something went wrong</h1>
        <p>Please reload to recover your session.</p>
        <button className="btn btn-primary" onClick={() => location.reload()}>
          Reload CampusHub
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
