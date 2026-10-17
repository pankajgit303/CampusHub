import { AdminCharts } from '../components/AdminCharts';
import { AcademicDashboard } from '../components/AcademicDashboard';
import { StudentPortal } from '../components/StudentPortal';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  Clock3,
  GraduationCap,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { list, type Row, type Table } from '../services/data';
import { attendanceRate, dateLabel } from '../lib/utils';
import { Empty, Loading, PageHeading, SectionTitle } from '../components/Shared';
const tables: Table[] = [
  'attendance',
  'assignments',
  'assignment_submissions',
  'notices',
  'timetable',
  'results',
  'events',
  'exams',
  'subjects',
  'departments',
  'profiles',
  'complaints',
  'placements',
  'grading_rules',
];
export default function Dashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState<Partial<Record<Table, Row[]>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    void Promise.all(tables.map(async (t) => [t, await list(t)] as const))
      .then((pairs) => setData(Object.fromEntries(pairs)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Loading />;
  if (error) return <div className="error-box">{error}</div>;
  const attendance = data.attendance || [];
  const assignments = data.assignments || [];
  const submissions = data.assignment_submissions || [];
  const exams = data.exams || [];
  const results = data.results || [];
  const notices = (data.notices || [])
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 3);
  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  const upcoming = exams.filter((e) => String(e.exam_date) >= date);
  const rate = attendanceRate(attendance);
  const pending = assignments.filter(
    (a) => !submissions.some((s) => s.assignment_id === a.id && s.student_id === profile?.id),
  );
  const subjectName = (id: unknown) =>
    String(data.subjects?.find((s) => s.id === id)?.subject_name || 'Subject');
  const trend = Object.entries(
    attendance.reduce<Record<string, Row[]>>((groups, r) => {
      (groups[String(r.attendance_date)] ||= []).push(r);
      return groups;
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([day, rows]) => ({
      day: dateLabel(day).slice(0, 6),
      attendance: attendanceRate(rows || []),
    }));
  const subjectChart = (data.subjects || [])
    .map((s) => ({
      name: String(s.subject_code),
      attendance: attendanceRate(attendance.filter((a) => a.subject_id === s.id)),
    }))
    .filter((s) => s.attendance !== null);
  const performance = results.map((r) => ({
    name: subjectName(r.subject_id),
    percentage: Math.round(
      (Number(r.marks_obtained) / Number(exams.find((e) => e.id === r.exam_id)?.max_marks || 100)) *
        100,
    ),
  }));
  const weighted = results.map((r) => {
    const percent =
      (Number(r.marks_obtained) / Number(exams.find((e) => e.id === r.exam_id)?.max_marks || 100)) *
      100;
    const rule = (data.grading_rules || [])
      .filter((g) => Number(g.min_percentage) <= percent)
      .sort((a, b) => Number(b.min_percentage) - Number(a.min_percentage))[0];
    const credits = Number(data.subjects?.find((s) => s.id === r.subject_id)?.credits || 1);
    return { points: Number(rule?.grade_points || 0), credits };
  });
  const gpa = weighted.length
    ? (
        weighted.reduce((sum, r) => sum + r.points * r.credits, 0) /
        weighted.reduce((sum, r) => sum + r.credits, 0)
      ).toFixed(2)
    : '—';
  const isAdmin = profile?.role === 'admin';
  const isFaculty = profile?.role === 'faculty';
  const stats = isAdmin
    ? [
        {
          label: 'Total students',
          value: (data.profiles || []).filter((p) => p.role === 'student').length,
          icon: Users,
          caption: 'Across your campus',
        },
        {
          label: 'Faculty members',
          value: (data.profiles || []).filter((p) => p.role === 'faculty').length,
          icon: GraduationCap,
          caption: 'Teaching & inspiring',
        },
        {
          label: 'Attendance rate',
          value: rate === null ? '—' : `${rate}%`,
          icon: CheckCheck,
          caption: 'Recorded classes',
        },
        {
          label: 'Active grievances',
          value: (data.complaints || []).filter(
            (c) => !['resolved', 'rejected'].includes(String(c.status)),
          ).length,
          icon: ClipboardList,
          caption: 'Awaiting resolution',
        },
      ]
    : [
        {
          label: 'Overall attendance',
          value: rate === null ? '—' : `${rate}%`,
          icon: CheckCheck,
          caption: 'Present / recorded classes',
        },
        {
          label: isFaculty ? 'Submissions received' : 'Pending assignments',
          value: isFaculty ? submissions.length : pending.length,
          icon: ClipboardList,
          caption: isFaculty ? 'Ready for your review' : 'A little progress every day',
        },
        {
          label: isFaculty ? 'Assigned subjects' : 'Current GPA',
          value: isFaculty ? data.subjects?.length : gpa,
          icon: GraduationCap,
          caption: isFaculty ? 'Your teaching workspace' : 'Weighted grade points / 10',
        },
        {
          label: 'Upcoming exams',
          value: upcoming.length,
          icon: CalendarDays,
          caption: 'Time to prepare',
        },
      ];
  const classes = (data.timetable || [])
    .filter((t) => Number(t.day_of_week) === today.getDay())
    .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
  if (profile?.role === 'student') return <StudentPortal data={data} />;
  if (!isAdmin)
    return (
      <StudentPortal data={data}>
        <AcademicDashboard data={data} gpa={gpa} />
      </StudentPortal>
    );
  return (
    <StudentPortal data={data}>
      <div className="admin-portal-insights">
        <PageHeading
          eyebrow={`${profile?.role?.toUpperCase()} WORKSPACE`}
          title={`Welcome back, ${profile?.full_name?.split(' ')[0] || 'there'} 👋`}
          description={`${today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Let’s make it a good one.`}
          action={
            <Link to="/app/timetable" className="btn btn-outline">
              <CalendarDays size={17} />
              Campus timetable
            </Link>
          }
        />
        <section className="welcome-banner">
          <div>
            <span className="pill">A LITTLE FOCUS GOES A LONG WAY</span>
            <h2>
              Your future is taking shape.
              <br />
              One day at a time.
            </h2>
            <p>Stay curious. Stay connected. Make today count.</p>
            <Link to={isAdmin ? '/app/people' : '/app/assignments'}>
              {isAdmin ? 'Manage your campus' : 'Explore your assignments'}{' '}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="banner-art">
            <div className="banner-orbit" />
            <GraduationCap size={100} strokeWidth={1} />
            <span className="art-star">✦</span>
            <span className="art-star small-star">✦</span>
          </div>
        </section>
        <div className="stats-grid">
          {stats.map(({ label, value, icon: Icon, caption }, i) => (
            <article className="stat-card" key={label}>
              <div>
                <span>{label}</span>
                <span className={`stat-icon color-${i % 3}`}>
                  <Icon size={19} />
                </span>
              </div>
              <strong>{value}</strong>
              <small>{caption}</small>
            </article>
          ))}
        </div>
        <div className="dashboard-grid">
          <section className="panel chart-panel">
            <SectionTitle title="Attendance overview" to="/app/attendance" />
            <p className="muted">Small habits. Steady progress.</p>
            {trend.length ? (
              <div className="chart">
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="violet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#008d9f" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#008d9f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="attendance"
                      stroke="#008d9f"
                      strokeWidth={3}
                      fill="url(#violet)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty
                title="Your progress starts here"
                text="Your attendance chart will appear after classes are recorded."
              />
            )}
          </section>
          <section className="panel">
            <SectionTitle title="Today’s campus classes" to="/app/timetable" />
            {classes.length ? (
              classes.map((c, i) => (
                <div className="schedule-row" key={c.id}>
                  <span className={`schedule-line color-${i % 3}`} />
                  <div>
                    <h3>{subjectName(c.subject_id)}</h3>
                    <p>
                      <Clock3 size={12} />
                      {String(c.start_time).slice(0, 5)} – {String(c.end_time).slice(0, 5)}{' '}
                      <span>· {String(c.room_number)}</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <Empty title="A little breathing room" text="No classes scheduled for today." />
            )}
          </section>
          <section className="panel">
            <SectionTitle title="Notice board" to="/app/notices" />
            {notices.length ? (
              notices.map((n) => (
                <Link to="/app/notices" className="notice-row" key={n.id}>
                  <span className={`notice-dot ${n.priority === 'urgent' ? 'red' : ''}`} />
                  <div>
                    <span className="badge">{String(n.priority)}</span>
                    <h3>{String(n.title)}</h3>
                    <small>{dateLabel(String(n.created_at))}</small>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              ))
            ) : (
              <Empty title="You’re all caught up" text="New notices will appear here." />
            )}
          </section>
          <section className="ai-promo">
            <span className="ai-mark">
              <Sparkles size={25} />
            </span>
            <span className="eyebrow">YOUR CAMPUS COMPANION</span>
            <h2>A question on your mind?</h2>
            <p>Find your next class, check a deadline, or catch up on campus news.</p>
            <Link to="/app/ai" className="btn btn-white">
              Ask Campus AI <ArrowUpRight size={16} />
            </Link>
            <div className="ai-promo-stars">✦</div>
          </section>
        </div>
        {(subjectChart.length > 0 || performance.length > 0) && (
          <div className="dashboard-grid">
            <section className="panel">
              <SectionTitle title="Subject-wise attendance" />
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={subjectChart}>
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="#008d9f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
            <section className="panel">
              <SectionTitle title="Campus academic performance" to="/app/results" />
              {performance.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={performance}>
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#39a88e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty title="Results are on their way" />
              )}
            </section>
          </div>
        )}
        {isAdmin && (
          <div className="stats-grid">
            {[
              { label: 'Departments', value: data.departments?.length },
              {
                label: 'Submission rate',
                value: assignments.length
                  ? `${Math.round(
                      (submissions.length /
                        Math.max(
                          1,
                          assignments.reduce((count, a) => {
                            const s = data.subjects?.find((s) => s.id === a.subject_id);
                            return (
                              count +
                              (data.profiles || []).filter(
                                (p) =>
                                  p.role === 'student' &&
                                  p.department_id === s?.department_id &&
                                  p.semester_id === s?.semester_id,
                              ).length
                            );
                          }, 0),
                        )) *
                        100,
                    )}%`
                  : '—',
              },
              { label: 'Upcoming exams', value: upcoming.length },
              {
                label: 'Open opportunities',
                value: data.placements?.filter((p) => String(p.deadline) >= date).length,
              },
            ].map((s) => (
              <div className="stat-card" key={s.label}>
                <span>{s.label}</span>
                <strong>{s.value}</strong>
              </div>
            ))}
          </div>
        )}
        {isAdmin && (
          <AdminCharts
            people={data.profiles || []}
            departments={data.departments || []}
            complaints={data.complaints || []}
            submissions={submissions}
          />
        )}
        <div className="dashboard-grid">
          <section className="panel">
            <SectionTitle title="Upcoming events" to="/app/events" />
            {(data.events || [])
              .filter((e) => new Date(String(e.event_date)) > today)
              .slice(0, 3)
              .map((e) => (
                <Link className="notice-row" to="/app/events" key={e.id}>
                  <CalendarDays size={22} />
                  <div>
                    <h3>{String(e.title)}</h3>
                    <small>
                      {dateLabel(String(e.event_date))} · {String(e.location)}
                    </small>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            {!(data.events || []).some((e) => new Date(String(e.event_date)) > today) && (
              <Empty title="More campus moments to come" />
            )}
          </section>
          <section className="panel">
            <SectionTitle title="Recent results" to="/app/results" />
            {results.slice(-3).map((r) => (
              <div className="notice-row" key={r.id}>
                <BookOpen size={22} />
                <div>
                  <h3>{subjectName(r.subject_id)}</h3>
                  <small>{String(r.marks_obtained)} marks</small>
                </div>
                <span className="badge badge-green">{String(r.grade)}</span>
              </div>
            ))}
            {!results.length && (
              <Empty title="A new chapter of learning" text="Published grades will appear here." />
            )}
          </section>
        </div>
      </div>
    </StudentPortal>
  );
}
