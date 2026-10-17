import { FooterCredit } from './FooterCredit';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Home,
  KeyRound,
  LogOut,
  GraduationCap,
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  Bell,
  UserRound,
  Sparkles,
  MessageSquareText,
  BriefcaseBusiness,
  CalendarHeart,
  ArrowRight,
  Moon,
  Sun,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Row, Table } from '../services/data';
import { dateLabel } from '../lib/utils';
import './student-portal.css';
import './workspace-theme.css';
import { PriorityBrief } from './PriorityBrief';
const services = [
  ['My Subjects', '/app/subjects', BookOpen],
  ['Assignments', '/app/assignments', FileText],
  ['Attendance Record', '/app/attendance', ClipboardCheck],
  ['Examination Schedule', '/app/exams', FileText],
  ['Semester Results', '/app/results', FileText],
  ['Class Timetable', '/app/timetable', CalendarDays],
  ['Study Materials', '/app/materials', BookOpen],
  ['Notice Board', '/app/notices', Bell],
  ['Campus Events', '/app/events', CalendarHeart],
  ['Placement Opportunities', '/app/placements', BriefcaseBusiness],
  ['Grievance Form', '/app/complaints', MessageSquareText],
  ['Student Basic Details', '/app/profile', UserRound],
  ['Contact Details Update', '/app/profile', FileText],
  ['Notifications', '/app/notifications', Bell],
  ['Campus AI Assistant', '/app/ai', Sparkles],
] as const;
const facultyServices = [
  ['My Subjects', '/app/subjects', BookOpen],
  ['Record Attendance', '/app/attendance', ClipboardCheck],
  ['Review Assignments', '/app/assignments', FileText],
  ['My Students', '/app/people', UserRound],
  ['Teaching Timetable', '/app/timetable', CalendarDays],
  ['Study Materials', '/app/materials', BookOpen],
  ['Examinations', '/app/exams', FileText],
  ['Publish Results', '/app/results', GraduationCap],
  ['Grading Rules', '/app/grading', ClipboardCheck],
  ['Notice Board', '/app/notices', Bell],
  ['Campus Events', '/app/events', CalendarHeart],
  ['Student Grievances', '/app/complaints', MessageSquareText],
  ['My Profile', '/app/profile', UserRound],
  ['Notifications', '/app/notifications', Bell],
  ['Campus AI', '/app/ai', Sparkles],
] as const;
const adminServices = [
  ['Students & Faculty', '/app/people', UserRound],
  ['Departments', '/app/departments', GraduationCap],
  ['Courses', '/app/courses', BookOpen],
  ['Semesters', '/app/semesters', CalendarDays],
  ['Subjects', '/app/subjects', BookOpen],
  ['Classrooms', '/app/classrooms', Home],
  ['Timetable', '/app/timetable', CalendarDays],
  ['Attendance Reports', '/app/attendance', ClipboardCheck],
  ['Assignments', '/app/assignments', FileText],
  ['Examinations', '/app/exams', FileText],
  ['Results', '/app/results', GraduationCap],
  ['Notice Board', '/app/notices', Bell],
  ['Campus Events', '/app/events', CalendarHeart],
  ['Placements', '/app/placements', BriefcaseBusiness],
  ['Grievances', '/app/complaints', MessageSquareText],
  ['Platform Settings', '/app/settings', ClipboardCheck],
  ['Audit Log', '/app/audit', FileText],
  ['Uploaded Files', '/app/files', FileText],
  ['Knowledge Base', '/app/documents', BookOpen],
  ['Notifications', '/app/notifications', Bell],
  ['Campus AI', '/app/ai', Sparkles],
] as const;
export function StudentPortal({
  data,
  children,
}: {
  data: Partial<Record<Table, Row[]>>;
  children?: ReactNode;
}) {
  const { profile } = useAuth();
  const role = profile?.role || 'student';
  const roleLabel =
    role === 'admin' ? 'Administration' : role === 'faculty' ? 'Faculty' : 'Student';
  const shortcuts =
    role === 'admin' ? adminServices : role === 'faculty' ? facultyServices : services;
  const [signingOut, setSigningOut] = useState(false);
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));
  const notices = [...(data.notices || [])]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 2);
  const department = data.departments?.find((d) => d.id === profile?.department_id);
  return (
    <div className={`student-portal unified-portal portal-${role}`}>
      <nav className="sp-toolbar" aria-label={`${roleLabel} account`}>
        <div>
          <span>CampusHub · {roleLabel} services</span>
          <div className="sp-account-actions">
            <Link to="/app" className="sp-home">
              <Home size={14} />
              Dashboard
            </Link>
            <Link to="/app/profile" className="sp-password">
              <KeyRound size={14} />
              Account & password
            </Link>
            <button
              className="sp-theme"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => {
                const next = !dark;
                setDark(next);
                document.documentElement.classList.toggle('dark', next);
                localStorage.setItem('campushub-theme', next ? 'dark' : 'light');
              }}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className="sp-logout"
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                const { error } = await supabase.auth.signOut();
                if (error) {
                  toast.error(error.message);
                  setSigningOut(false);
                }
              }}
            >
              <LogOut size={14} />
              {signingOut ? 'Signing out…' : 'Logout'}
            </button>
          </div>
        </div>
      </nav>
      <header className="sp-brand">
        <div className="sp-brand-inner">
          <div className="sp-identity">
            <span className="sp-crest">
              <GraduationCap size={40} />
            </span>
            <div>
              <h1>CampusHub</h1>
              <p>Smart Campus Management System</p>
              <small>
                {department ? String(department.name) : `${roleLabel} academic services portal`}
              </small>
            </div>
          </div>
          <div className="sp-header-help">
            <span>Need assistance?</span>
            <Link to="/app/complaints">Contact your campus team</Link>
          </div>
          <div className="sp-student-label">
            <GraduationCap size={22} />
            <strong>{roleLabel.toUpperCase()} PORTAL</strong>
            <span>Academic services & information</span>
          </div>
        </div>
      </header>
      <div className="sp-container">
        <div className="sp-welcome">
          <span>{roleLabel.toUpperCase()} DASHBOARD</span>
          <strong>Welcome {profile?.full_name}</strong>
          <p>
            {role === 'admin'
              ? 'Your people, academics and campus operations, connected.'
              : role === 'faculty'
                ? 'A clear view of your teaching day and the students you support.'
                : 'Your learning, campus life and next opportunities, all in one place.'}
          </p>
        </div>
        <PriorityBrief data={data} />
        <div className="workspace-section-heading">
          <div>
            <span>YOUR CAMPUS TOOLS</span>
            <h2>
              {role === 'admin'
                ? 'Manage your campus.'
                : role === 'faculty'
                  ? 'Make room for teaching.'
                  : 'Your next step starts here.'}
            </h2>
          </div>
          <p>Choose a service to open your workspace.</p>
        </div>
        <section className="sp-services" aria-label={`${roleLabel} services`}>
          <div className="sp-tile-grid">
            {shortcuts.map(([label, to, Icon], i) => (
              <Link
                className="sp-tile"
                aria-label={label}
                to={to}
                key={label}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className="sp-tile-icon">
                  <Icon size={36} strokeWidth={1.8} />
                </span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <aside className="sp-sidebar">
            <div className="sp-alert sp-alert-rose">
              <strong>
                {role === 'admin'
                  ? 'Campus administration'
                  : role === 'faculty'
                    ? 'Teaching workspace'
                    : 'Academic assistance'}
              </strong>
              <p>
                {role === 'admin'
                  ? 'Manage accounts, assign faculty, and maintain your college’s academic information.'
                  : role === 'faculty'
                    ? 'Record attendance, share materials, and review student work using your assigned teaching tools.'
                    : 'For examination, attendance, or account queries, contact your college team.'}
              </p>
              <Link
                to={
                  role === 'admin'
                    ? '/app/people'
                    : role === 'faculty'
                      ? '/app/assignments'
                      : '/app/complaints'
                }
              >
                {role === 'admin'
                  ? 'Manage people'
                  : role === 'faculty'
                    ? 'Review assignments'
                    : 'Submit a grievance'}{' '}
                <ArrowRight size={14} />
              </Link>
            </div>
            <Link className="sp-tile sp-exam" to="/app/exams">
              <span className="sp-tile-icon">
                <FileText size={38} />
              </span>
              <span>EXAMINATIONS</span>
            </Link>
            <div className="sp-alert sp-alert-green">
              <strong>Keep your account details up to date.</strong>
              <p>
                Check your name, contact information, and profile photo so your college has accurate
                records.
              </p>
              <Link to="/app/profile">
                View profile details <ArrowRight size={14} />
              </Link>
            </div>
            {role === 'student' && !profile?.department_id && (
              <div className="sp-alert sp-alert-blue">
                <strong>Academic setup pending</strong>
                <p>
                  Your administrator needs to assign your department and semester before your
                  classes appear.
                </p>
              </div>
            )}
          </aside>
        </section>
        {children && (
          <section className="portal-insights" aria-label={`${roleLabel} overview`}>
            {children}
          </section>
        )}
        <section className="sp-updates">
          <div>
            <h2>
              <Bell size={18} />
              Latest campus notices
            </h2>
            <Link to="/app/notices">
              View all notices <ArrowRight size={14} />
            </Link>
          </div>
          {notices.length ? (
            notices.map((n) => (
              <Link className="sp-notice" to="/app/notices" key={n.id}>
                <span>{String(n.title)}</span>
                <small>{dateLabel(String(n.created_at))}</small>
              </Link>
            ))
          ) : (
            <p>No notices have been published for you yet.</p>
          )}
        </section>
      </div>
      <footer className="sp-footer">
        <FooterCredit />
      </footer>
    </div>
  );
}
