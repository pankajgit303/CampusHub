import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Row, Table } from '../services/data';
export function PriorityBrief({ data }: { data: Partial<Record<Table, Row[]>> }) {
  const { profile } = useAuth();
  if (!profile) return null;
  const items: { title: string; detail: string; path: string }[] = [];
  const assignments = data.assignments || [],
    submissions = data.assignment_submissions || [];
  if (profile.role === 'student') {
    const pending = assignments.filter(
      (a) => !submissions.some((s) => s.assignment_id === a.id && s.student_id === profile.id),
    );
    const overdue = pending.filter((a) => new Date(String(a.due_date)) < new Date());
    if (pending.length)
      items.push({
        title: `${pending.length} outstanding assignments`,
        detail: overdue.length
          ? `${overdue.length} have passed their deadline. Check submission availability.`
          : 'Review deadlines and choose your next task.',
        path: 'assignments',
      });
    if (!profile.department_id)
      items.push({
        title: 'Complete your academic setup',
        detail: 'Ask your administrator to assign your department and semester.',
        path: 'profile',
      });
  } else if (profile.role === 'faculty') {
    const mine = new Set(assignments.filter((a) => a.faculty_id === profile.id).map((a) => a.id));
    const review = submissions.filter(
      (s) => mine.has(String(s.assignment_id)) && ['submitted', 'late'].includes(String(s.status)),
    );
    if (review.length)
      items.push({
        title: `${review.length} submissions await review`,
        detail: 'Open assignments to give marks and feedback.',
        path: 'assignments',
      });
  } else {
    const unassigned = (data.subjects || []).filter((s) => !s.faculty_id);
    if (unassigned.length)
      items.push({
        title: `${unassigned.length} subjects need faculty`,
        detail: 'Review teaching assignments before classes begin.',
        path: 'subjects',
      });
    const students = (data.profiles || []).filter(
      (p) =>
        p.role === 'student' &&
        p.account_status === 'active' &&
        (!p.department_id || !p.semester_id),
    );
    if (students.length)
      items.push({
        title: `${students.length} students need academic setup`,
        detail: 'Assign their department and semester in People.',
        path: 'people',
      });
  }
  const urgent = (data.notices || []).filter((n) => n.priority === 'urgent');
  if (urgent.length)
    items.push({
      title: `${urgent.length} urgent notices available`,
      detail: 'Review the notice board for important information.',
      path: 'notices',
    });
  return (
    <section className="priority-brief" aria-label="Campus priorities">
      <header>
        <div>
          <span>
            <Sparkles size={16} /> YOUR CAMPUS BRIEF
          </span>
          <h2>Focus on what needs attention.</h2>
        </div>
        <Link to="/app/ai">
          Ask the assistant <ArrowRight size={15} />
        </Link>
      </header>
      <p>Suggestions based on your accessible records. Nothing is changed automatically.</p>
      <div className="priority-items">
        {items.length ? (
          items.slice(0, 3).map((i) => (
            <Link key={i.path} to={'/app/' + i.path}>
              <strong>{i.title}</strong>
              <p>{i.detail}</p>
              <span>
                Review <ArrowRight size={14} />
              </span>
            </Link>
          ))
        ) : (
          <div>
            <strong>No priority flags in your available records.</strong>
            <p>Check your timetable and notices to plan your day.</p>
            <Link to="/app/timetable">Open timetable →</Link>
          </div>
        )}
      </div>
    </section>
  );
}
