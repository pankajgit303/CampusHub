import { list, type Row } from './data';
import { attendanceRate, dateLabel } from '../lib/utils';
export async function campusAnswer(question: string, profile: { id: string; role: string }) {
  const q = question.toLowerCase();
  const response = (answer: string, label: string, path: string) => ({
    answer,
    mode: 'lookup',
    sources: [{ label, path: '/app/' + path }],
  });
  const subjects = await list('subjects');
  const name = (id: unknown) =>
    String(subjects.find((s) => s.id === id)?.subject_name || 'Subject');
  const mine = new Set(subjects.filter((s) => s.faculty_id === profile.id).map((s) => s.id));
  if (/attendance|present|absent/.test(q)) {
    const rows = (await list('attendance')).filter((r) =>
      profile.role === 'student'
        ? r.student_id === profile.id
        : profile.role === 'faculty'
          ? mine.has(String(r.subject_id))
          : true,
    );
    const rate = attendanceRate(rows);
    return response(
      rate === null
        ? 'No attendance records are available yet.'
        : `${profile.role === 'student' ? 'Your' : profile.role === 'faculty' ? 'Your assigned subjects’' : 'Campus'} recorded attendance is ${rate}%. ${rows.filter((r) => r.status === 'present').length} present out of ${rows.length} student attendance records. Late and excused records are not counted as present.`,
      'Attendance records',
      'attendance',
    );
  }
  if (/assignment|submission|deadline|homework/.test(q)) {
    const assignments = (await list('assignments')).filter(
      (r) => profile.role !== 'faculty' || mine.has(String(r.subject_id)),
    );
    const submissions = await list('assignment_submissions');
    if (profile.role === 'faculty' && /review|submission|grade/.test(q)) {
      const rows = submissions.filter(
        (s) =>
          ['submitted', 'late'].includes(String(s.status)) &&
          assignments.some((a) => a.id === s.assignment_id),
      );
      return response(
        rows.length
          ? `${rows.length} submissions await review.\n` +
              assignments
                .filter((a) => rows.some((s) => s.assignment_id === a.id))
                .map(
                  (a) =>
                    `• ${a.title}: ${rows.filter((s) => s.assignment_id === a.id).length} to review`,
                )
                .join('\n')
          : 'No submitted work is awaiting review.',
        'Assignment submissions',
        'assignments',
      );
    }
    const rows = assignments
      .filter(
        (a) =>
          profile.role !== 'student' ||
          !submissions.some((s) => s.assignment_id === a.id && s.student_id === profile.id),
      )
      .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));
    return response(
      rows.length
        ? `${profile.role === 'student' ? 'Your outstanding' : 'Visible'} assignments (${rows.length}):\n` +
            rows
              .slice(0, 10)
              .map(
                (a) =>
                  `• ${a.title} · ${name(a.subject_id)} · ${dateLabel(String(a.due_date))}${new Date(String(a.due_date)) < new Date() ? ' (deadline passed)' : ''}`,
              )
              .join('\n') +
            (rows.length > 10 ? '\nShowing 10; open Assignments for all records.' : '')
        : 'No outstanding assignments are available.',
      'Assignments',
      'assignments',
    );
  }
  if (/exam/.test(q)) {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const rows = (await list('exams'))
      .filter(
        (e) =>
          String(e.exam_date) >= today &&
          (profile.role !== 'faculty' || mine.has(String(e.subject_id))),
      )
      .sort((a, b) => String(a.exam_date).localeCompare(String(b.exam_date)));
    return response(
      rows.length
        ? rows
            .slice(0, 10)
            .map(
              (e) =>
                `• ${e.title} · ${name(e.subject_id)} · ${dateLabel(String(e.exam_date))} at ${String(e.start_time).slice(0, 5)} · Room ${e.room_number || 'not announced'}`,
            )
            .join('\n')
        : 'No upcoming examinations are available.',
      'Examination schedule',
      'exams',
    );
  }
  if (/class|timetable|schedule/.test(q)) {
    const rows = (await list('timetable')).filter(
      (r) => profile.role !== 'faculty' || r.faculty_id === profile.id,
    );
    const india = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const day = india.getDay(),
      minute = india.getHours() * 60 + india.getMinutes();
    const minutes = (v: unknown) =>
      Number(String(v).slice(0, 2)) * 60 + Number(String(v).slice(3, 5));
    const sorted = rows
      .map<Row & { wait: number }>((r) => ({
        ...r,
        wait:
          ((Number(r.day_of_week) - day) * 1440 + minutes(r.start_time) - minute + 10080) % 10080,
      }))
      .sort((a, b) => a.wait - b.wait);
    const chosen = /today/.test(q)
      ? sorted
          .filter((r) => Number(r.day_of_week) === day)
          .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
      : /next/.test(q)
        ? sorted.slice(0, 1)
        : sorted;
    return response(
      chosen.length
        ? chosen
            .map(
              (r) =>
                `• ${name(r.subject_id)} · ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][Number(r.day_of_week)]} ${String(r.start_time).slice(0, 5)}–${String(r.end_time).slice(0, 5)} · Room ${r.room_number || 'not announced'}`,
            )
            .join('\n') + '\nTimes are in India Standard Time.'
        : /today/.test(q)
          ? 'No classes are scheduled for today.'
          : 'No classes are available in your timetable.',
      'Timetable',
      'timetable',
    );
  }
  if (/notice|announcement|update/.test(q)) {
    const rows = (await list('notices')).sort((a, b) =>
      String(b.created_at).localeCompare(String(a.created_at)),
    );
    return response(
      rows.length
        ? rows
            .slice(0, 5)
            .map(
              (r) =>
                `• ${r.title} (${dateLabel(String(r.created_at))})\n${String(r.content || '').slice(0, 700)}`,
            )
            .join('\n\n')
        : 'No notices are available.',
      'Notice board',
      'notices',
    );
  }
  if (/material|resource|notes/.test(q)) {
    const rows = (await list('study_materials')).filter(
      (r) => profile.role !== 'faculty' || mine.has(String(r.subject_id)),
    );
    return response(
      rows.length
        ? rows
            .slice(0, 10)
            .map((r) => `• ${r.title} · ${name(r.subject_id)}`)
            .join('\n')
        : 'No study materials are available.',
      'Study materials',
      'materials',
    );
  }
  return {
    answer:
      'I can look up attendance, assignments, submissions awaiting review, today’s classes, your next class, examinations, study materials, and campus notices. Try one of these topics. I do not generate answers or change records.',
    mode: 'lookup',
    sources: [],
  };
}
