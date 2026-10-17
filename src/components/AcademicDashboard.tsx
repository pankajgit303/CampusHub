import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  Clock3,
  GraduationCap,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Row, Table } from '../services/data';
import { attendanceRate, dateLabel } from '../lib/utils';
import { Empty, SectionTitle } from './Shared';
import './academic-dashboard.css';

export function AcademicDashboard({
  data,
  gpa,
}: {
  data: Partial<Record<Table, Row[]>>;
  gpa: string;
}) {
  const { profile } = useAuth();
  const faculty = profile?.role === 'faculty';
  const now = new Date();
  const subjects = (data.subjects || []).filter((s) => !faculty || s.faculty_id === profile?.id);
  const subjectIds = new Set(subjects.map((s) => s.id));
  const attendance = (data.attendance || []).filter(
    (a) => !faculty || subjectIds.has(String(a.subject_id)),
  );
  const rate = attendanceRate(attendance);
  const assignments = (data.assignments || []).filter(
    (a) => !faculty || subjectIds.has(String(a.subject_id)),
  );
  const submissions = (data.assignment_submissions || []).filter((s) =>
    assignments.some((a) => a.id === s.assignment_id),
  );
  const review = submissions.filter((s) => ['submitted', 'late'].includes(String(s.status)));
  const pending = assignments.filter(
    (a) => !submissions.some((s) => s.assignment_id === a.id && s.student_id === profile?.id),
  );
  const tasks = (
    faculty ? assignments.filter((a) => review.some((s) => s.assignment_id === a.id)) : pending
  ).sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));
  const classes = (data.timetable || [])
    .filter(
      (t) =>
        Number(t.day_of_week) === now.getDay() &&
        (!faculty || subjectIds.has(String(t.subject_id))),
    )
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
  const subjectName = (id: unknown) =>
    String((data.subjects || []).find((s) => s.id === id)?.subject_name || 'Subject');
  const notices = [...(data.notices || [])]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 3);
  const metrics = faculty
    ? [
        {
          label: 'Assigned subjects',
          value: subjects.length,
          note: 'Your teaching portfolio',
          icon: BookOpen,
          to: '/app/timetable',
        },
        {
          label: 'Awaiting review',
          value: review.length,
          note: 'Submitted and late work',
          icon: ClipboardList,
          to: '/app/assignments',
        },
        {
          label: 'Class attendance',
          value: rate === null ? '—' : `${rate}%`,
          note: 'Across assigned subjects',
          icon: CheckCheck,
          to: '/app/attendance',
        },
        {
          label: 'Classes today',
          value: classes.length,
          note: 'On your timetable',
          icon: Users,
          to: '/app/timetable',
        },
      ]
    : [
        {
          label: 'My attendance',
          value: rate === null ? '—' : `${rate}%`,
          note: 'Across recorded classes',
          icon: CheckCheck,
          to: '/app/attendance',
        },
        {
          label: 'Pending assignments',
          value: pending.length,
          note: 'Your next steps',
          icon: ClipboardList,
          to: '/app/assignments',
        },
        {
          label: 'Current GPA',
          value: gpa,
          note: 'Weighted grade points / 10',
          icon: GraduationCap,
          to: '/app/results',
        },
        {
          label: 'Enrolled subjects',
          value: subjects.length,
          note: 'Your learning portfolio',
          icon: BookOpen,
          to: '/app/materials',
        },
      ];
  const actions = faculty
    ? ([
        ['Record attendance', '/app/attendance', CheckCheck],
        ['Review assignments', '/app/assignments', ClipboardList],
        ['Teaching materials', '/app/materials', BookOpen],
      ] as const)
    : ([
        ['My assignments', '/app/assignments', ClipboardList],
        ['Study materials', '/app/materials', BookOpen],
        ['Exam schedule', '/app/exams', CalendarDays],
      ] as const);
  return (
    <div className={`academic-dashboard ${faculty ? 'faculty-dashboard' : 'student-dashboard'}`}>
      <header className="ad-heading">
        <div>
          <span className="ad-eyebrow">{faculty ? 'FACULTY WORKSPACE' : 'STUDENT WORKSPACE'}</span>
          <h1>Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}.</h1>
          <p>
            {faculty ? 'A clear view of your teaching day.' : 'Your learning, all in one place.'}
          </p>
        </div>
        <div className="ad-date">
          <CalendarDays size={17} />
          <span>
            {now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </header>
      {!faculty && !profile?.department_id && (
        <div className="info-banner">
          <GraduationCap size={22} />
          <p>
            Your administrator needs to assign your department and semester before your classes
            appear.
          </p>
        </div>
      )}
      <section className="ad-hero">
        <div className="ad-hero-copy">
          <span className="ad-hero-label">
            <span /> {faculty ? 'TEACH WITH PURPOSE' : 'MAKE ROOM FOR PROGRESS'}
          </span>
          <h2>
            {faculty ? (
              <>
                Inspire your class.
                <br />
                Shape what comes next.
              </>
            ) : (
              <>
                A little focus today.
                <br />A brighter tomorrow.
              </>
            )}
          </h2>
          <p>
            {faculty
              ? 'Keep your classes, student work, and teaching resources moving together.'
              : 'Stay on top of your classes and deadlines, and take your next step with confidence.'}
          </p>
          <Link to={faculty ? '/app/attendance' : '/app/assignments'} className="ad-primary">
            {faculty ? 'Record attendance' : 'View my assignments'}
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="ad-day-card">
          <div className="ad-day-title">
            <CalendarDays size={18} />
            <span>YOUR DAY AT A GLANCE</span>
          </div>
          <strong>
            {String(classes.length).padStart(2, '0')}
            <span>classes today</span>
          </strong>
          <div className="ad-day-divider" />
          <p>
            {classes.length
              ? `${String(classes[0].start_time).slice(0, 5)} · ${subjectName(classes[0].subject_id)}`
              : 'No classes scheduled today'}
          </p>
          <Link to="/app/timetable">
            Open timetable <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <section className="ad-metrics" aria-label="Workspace overview">
        {metrics.map(({ label, value, note, icon: Icon, to }, i) => (
          <Link to={to} className="ad-metric" key={label} style={{ animationDelay: `${i * 65}ms` }}>
            <div className="ad-metric-top">
              <span className="ad-icon">
                <Icon size={20} />
              </span>
              <ArrowUpRight size={16} />
            </div>
            <strong>{value}</strong>
            <h2>{label}</h2>
            <p>{note}</p>
          </Link>
        ))}
      </section>
      <nav className="ad-actions" aria-label="Quick actions">
        {actions.map(([label, to, Icon]) => (
          <Link to={to} key={to}>
            <Icon size={18} />
            <span>{label}</span>
            <ArrowRight size={16} />
          </Link>
        ))}
      </nav>
      <div className="ad-columns">
        <div className="ad-main">
          <section className="ad-panel">
            <SectionTitle
              title={faculty ? 'Your review queue' : 'Assignment priorities'}
              to="/app/assignments"
            />
            <p className="ad-subtitle">
              {faculty
                ? 'Student work ready for your feedback.'
                : 'Outstanding work, ordered by deadline.'}
            </p>
            {tasks.length ? (
              tasks.slice(0, 4).map((a) => (
                <Link className="ad-task" to={`/app/assignments/${a.id}`} key={a.id}>
                  <span className="ad-task-icon">
                    <ClipboardList size={19} />
                  </span>
                  <div>
                    <h3>{String(a.title)}</h3>
                    <p>
                      {subjectName(a.subject_id)} · Due {dateLabel(String(a.due_date))}
                    </p>
                  </div>
                  <span
                    className={`ad-tag ${!faculty && new Date(String(a.due_date)) < now ? 'ad-overdue' : ''}`}
                  >
                    {faculty
                      ? `${review.filter((s) => s.assignment_id === a.id).length} to review`
                      : new Date(String(a.due_date)) < now
                        ? 'Overdue'
                        : 'To do'}
                  </span>
                  <ArrowUpRight size={16} />
                </Link>
              ))
            ) : (
              <Empty
                title={faculty ? 'Your review queue is clear' : 'You’re all caught up'}
                text={
                  faculty
                    ? 'New submissions will appear here when students send their work.'
                    : 'New assignments will appear here when your faculty publishes them.'
                }
              />
            )}
          </section>
          <section className="ad-panel">
            <SectionTitle
              title={faculty ? 'Attendance by subject' : 'Your subject progress'}
              to="/app/attendance"
            />
            <p className="ad-subtitle">Attendance across recorded classes.</p>
            {subjects.length ? (
              <div className="ad-subjects">
                {subjects.map((s) => {
                  const percent = attendanceRate(attendance.filter((a) => a.subject_id === s.id));
                  return (
                    <div className="ad-subject" key={s.id}>
                      <div>
                        <span className="ad-subject-code">{String(s.subject_code)}</span>
                        <strong>{percent === null ? '—' : `${percent}%`}</strong>
                      </div>
                      <h3>{String(s.subject_name)}</h3>
                      <div
                        className="ad-progress"
                        role="meter"
                        aria-label={`${String(s.subject_name)} attendance`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent ?? undefined}
                        aria-valuetext={percent === null ? 'No attendance recorded' : `${percent}%`}
                      >
                        <span style={{ width: `${percent || 0}%` }} />
                      </div>
                      <small>
                        {percent === null ? 'No attendance recorded' : 'Present / recorded classes'}
                      </small>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty
                title={faculty ? 'Your subjects will appear here' : 'Your semester starts here'}
                text="Subjects will appear once your academic assignments are set up."
              />
            )}
          </section>
        </div>
        <aside className="ad-side">
          <section className="ad-panel">
            <SectionTitle title="Today’s schedule" to="/app/timetable" />
            {classes.length ? (
              classes.map((c, i) => (
                <div className="ad-class" key={c.id}>
                  <div className="ad-class-time">
                    {String(c.start_time).slice(0, 5)}
                    <span>{String(c.end_time).slice(0, 5)}</span>
                  </div>
                  <div>
                    <span className="ad-class-index">CLASS {String(i + 1).padStart(2, '0')}</span>
                    <h3>{subjectName(c.subject_id)}</h3>
                    <p>
                      <Clock3 size={12} />{' '}
                      {c.room_number ? `Room ${String(c.room_number)}` : 'Room to be announced'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <Empty
                title="A clear schedule"
                text="No classes scheduled for today. View your timetable to plan ahead."
              />
            )}
          </section>
          <section className="ad-panel">
            <SectionTitle title="Campus updates" to="/app/notices" />
            {notices.length ? (
              notices.map((n) => (
                <Link className="ad-notice" to="/app/notices" key={n.id}>
                  <div>
                    <span className={n.priority === 'urgent' ? 'ad-urgent' : 'ad-notice-label'}>
                      {String(n.priority || 'Notice')}
                    </span>
                    <small>{dateLabel(String(n.created_at))}</small>
                  </div>
                  <h3>{String(n.title)}</h3>
                </Link>
              ))
            ) : (
              <Empty title="You’re up to date" text="Campus announcements will appear here." />
            )}
          </section>
          <Link to="/app/ai" className="ad-assistant">
            <span className="ad-icon">
              <Sparkles size={21} />
            </span>
            <div>
              <h3>A little help, right here.</h3>
              <p>Ask Campus AI about your day.</p>
            </div>
            <ArrowUpRight size={18} />
          </Link>
        </aside>
      </div>
    </div>
  );
}

