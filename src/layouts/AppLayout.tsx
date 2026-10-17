import { FooterCredit } from '../components/FooterCredit';
import { StorageImage } from '../components/StorageImage';
import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  CalendarDays,
  Bell,
  GraduationCap,
  Library,
  CalendarHeart,
  BriefcaseBusiness,
  MessageSquareText,
  Sparkles,
  Settings,
  Users,
  Building2,
  School,
  Layers,
  DoorOpen,
  ScrollText,
  Menu,
  Search,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  PanelLeftClose,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useTable } from '../hooks/useTable';
import { supabase } from '../lib/supabase';
import { list, type Row, type Table } from '../services/data';
import { displayName } from '../features/resources';
import { Logo, Loading } from '../components/Shared';
import { Button } from '../components/ui/button';
import { Dialog } from '../components/ui/dialog';
const mainNav = [
  ['', 'Overview', LayoutDashboard],
  ['attendance', 'Attendance', ClipboardCheck],
  ['assignments', 'Assignments', BookOpen],
  ['timetable', 'Timetable', CalendarDays],
  ['results', 'Results', GraduationCap],
  ['exams', 'Examinations', ScrollText],
  ['materials', 'Study materials', Library],
] as const;
const campusNav = [
  ['notices', 'Notice board', Bell],
  ['events', 'Campus events', CalendarHeart],
  ['placements', 'Opportunities', BriefcaseBusiness],
  ['complaints', 'Grievances', MessageSquareText],
] as const;
const adminNav = [
  ['people', 'People', Users],
  ['departments', 'Departments', Building2],
  ['courses', 'Courses', School],
  ['semesters', 'Semesters', Layers],
  ['subjects', 'Subjects', BookOpen],
  ['grading', 'Grading rules', GraduationCap],
  ['classrooms', 'Classrooms', DoorOpen],
  ['grading', 'Grading rules', GraduationCap],
  ['settings', 'Platform settings', SlidersHorizontal],
  ['documents', 'Knowledge base', Library],
  ['files', 'Uploaded files', Library],
  ['audit', 'Audit log', ScrollText],
] as const;
const searchTables: { table: Table; path: string }[] = [
  { table: 'notices', path: 'notices' },
  { table: 'assignments', path: 'assignments' },
  { table: 'study_materials', path: 'materials' },
  { table: 'events', path: 'events' },
  { table: 'placements', path: 'placements' },
];
export default function AppLayout() {
  const { profile, session, loading, error } = useAuth();
  const notifications = useTable('notifications');
  const navigate = useNavigate();
  const location = useLocation();
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchData, setSearchData] = useState<(Row & { path: string })[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dark, setDark] = useState(localStorage.getItem('campushub-theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('campushub-theme', dark ? 'dark' : 'light');
  }, [dark]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  useEffect(() => {
    if (!searchOpen) return;
    setSearchLoading(true);
    void Promise.all(
      searchTables.map(async (t) => (await list(t.table)).map((r) => ({ ...r, path: t.path }))),
    )
      .then((groups) => setSearchData(groups.flat()))
      .catch((e) => toast.error(e.message))
      .finally(() => setSearchLoading(false));
  }, [searchOpen]);
  if (loading)
    return (
      <div className="loading-page">
        <Loading />
      </div>
    );
  if (!session) return <Navigate to="/auth/login" replace />;
  if (!profile)
    return (
      <div className="error-page">
        <h1>Account unavailable</h1>
        <p>{error}</p>
        <Button onClick={() => void supabase.auth.signOut()}>Sign out</Button>
      </div>
    );
  const nav = (items: ReadonlyArray<readonly [string, string, typeof LayoutDashboard]>) =>
    items.map(([path, label, Icon]) => (
      <NavLink
        key={path}
        end={path === ''}
        to={`/app${path ? `/${path}` : ''}`}
        onClick={() => setMobile(false)}
        title={collapsed ? label : undefined}
      >
        <Icon size={19} />
        <span>
          {profile.role === 'admin' && path === 'attendance' ? 'Attendance reports' : label}
        </span>
        {path === 'notices' && <span className="nav-dot" />}
      </NavLink>
    ));
  return (
    <div
      className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${location.pathname.replace(/\/$/, '') === '/app' ? 'student-portal-shell' : ''}`}
    >
      {mobile && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}>
        <Logo />
        <button
          className="mobile-close"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        >
          <X />
        </button>
        <div className="workspace-label">
          <span className="workspace-avatar">
            <School size={17} />
          </span>
          <div>
            <b>My campus</b>
            <small>{profile.role} workspace</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <nav>
          <span className="nav-section">WORKSPACE</span>
          {nav(mainNav)}
          {profile.role !== 'admin' && nav([['subjects', 'My subjects', BookOpen]])}
          <span className="nav-section">CAMPUS LIFE</span>
          {nav(campusNav)}
          <NavLink to="/app/ai" className="ai-nav" onClick={() => setMobile(false)}>
            <Sparkles size={19} />
            <span>Campus AI</span>
            <span className="new-tag">NEW</span>
          </NavLink>
          {profile.role === 'admin' && (
            <>
              <span className="nav-section">ADMINISTRATION</span>
              {nav(adminNav)}
            </>
          )}
          {profile.role === 'faculty' &&
            nav([
              ['people', 'My students', Users],
              ['grading', 'Grading rules', GraduationCap],
            ])}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/app/profile">
            <Settings size={18} />
            <span>Settings & profile</span>
          </NavLink>
          <button onClick={() => setCollapsed((v) => !v)}>
            <PanelLeftClose size={18} />
            <span>Collapse sidebar</span>
          </button>
          <div className="sidebar-brand">
            <span className="green-dot" />
            <span>A little more connected.</span>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              My campus <span>/</span> <b>Workspace</b>
            </span>
          </div>
          <div className="topbar-actions">
            <button className="global-search" onClick={() => setSearchOpen(true)}>
              <Search size={17} />
              <span>Search anything…</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              className="icon-button"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setDark((v) => !v)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <NavLink
              to="/app/notifications"
              className="notification-button icon-button"
              aria-label={`${notifications.rows.filter((n) => !n.read).length} unread notifications`}
            >
              <Bell size={20} />
              {notifications.rows.some((n) => !n.read) && <span />}
            </NavLink>
            <div className="topbar-divider" />
            <NavLink className="profile-nav" to="/app/profile">
              <span className="avatar">
                {profile.avatar_url ? (
                  <StorageImage bucket="avatars" path={profile.avatar_url} alt="Your profile" />
                ) : (
                  profile.full_name.slice(0, 2).toUpperCase() || 'CH'
                )}
              </span>
              <span>
                <b>{profile.full_name || 'My account'}</b>
                <small>{profile.role}</small>
              </span>
              <ChevronDown size={14} />
            </NavLink>
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) toast.error(error.message);
                else navigate('/auth/login');
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="workspace-content">
          <Outlet />
          {location.pathname !== '/app/ai' && location.pathname !== '/app' && (
            <div className="context-assistant">
              <Link
                to={`/app/ai?q=${encodeURIComponent(location.pathname.includes('attendance') ? 'Show attendance records' : location.pathname.includes('assignments') ? (profile.role === 'faculty' ? 'Which submissions need review?' : 'What assignments are due?') : location.pathname.includes('exams') ? 'Show upcoming examinations' : location.pathname.includes('timetable') ? 'What classes are scheduled today?' : 'What is the latest notice?')}`}
              >
                <Sparkles size={16} />
                Ask the campus assistant
              </Link>
            </div>
          )}
        </main>
        <footer className="workspace-footer">
          <FooterCredit />
        </footer>
      </div>
      <Dialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Find your way around"
        description="Search notices, assignments, materials, events and opportunities."
      >
        <div className="input-icon search-dialog-input">
          <Search size={18} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for?"
          />
        </div>
        <div className="search-results">
          {searchLoading ? (
            <Loading />
          ) : (
            searchData
              .filter((r) =>
                Object.values(r).some((v) => String(v).toLowerCase().includes(query.toLowerCase())),
              )
              .slice(0, 20)
              .map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    navigate(`/app/${r.path}`);
                    setSearchOpen(false);
                  }}
                >
                  <Search size={16} />
                  <span>
                    {displayName(r)}
                    <small>{r.path}</small>
                  </span>
                </button>
              ))
          )}
          {!searchLoading &&
            !searchData.some((r) =>
              Object.values(r).some((v) => String(v).toLowerCase().includes(query.toLowerCase())),
            ) && <p className="muted">No results. Try another search.</p>}
        </div>
      </Dialog>
    </div>
  );
}
