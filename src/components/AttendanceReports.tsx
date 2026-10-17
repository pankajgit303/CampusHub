import { useState } from 'react';
import { useTable } from '../hooks/useTable';
import { attendanceRate, dateLabel } from '../lib/utils';
import { Empty, Loading } from './Shared';
export function AttendanceReports() {
  const attendance = useTable('attendance'),
    subjects = useTable('subjects'),
    people = useTable('profiles');
  const [subject, setSubject] = useState(''),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [search, setSearch] = useState('');
  const person = (id: unknown) => people.rows.find((p) => p.id === id);
  const rows = attendance.rows
    .filter(
      (r) =>
        (!subject || r.subject_id === subject) &&
        (!from || String(r.attendance_date) >= from) &&
        (!to || String(r.attendance_date) <= to) &&
        `${person(r.student_id)?.full_name || ''} ${person(r.student_id)?.roll_number || ''}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => String(b.attendance_date).localeCompare(String(a.attendance_date)));
  const rate = attendanceRate(rows);
  const error = attendance.error || subjects.error || people.error;
  if (attendance.loading || subjects.loading || people.loading) return <Loading />;
  if (error) return <p className="error-box">{error}</p>;
  return (
    <>
      <div className="info-banner">
        Faculty record attendance. Use this report to monitor attendance across the campus.
      </div>
      <div className="resource-toolbar">
        <label>
          Subject
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">All subjects</option>
            {subjects.rows.map((s) => (
              <option key={s.id} value={s.id}>
                {String(s.subject_name)}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            max={to || undefined}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            min={from || undefined}
          />
        </label>
        <label>
          Student
          <input
            placeholder="Name or roll number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="stats-grid">
        {[
          ['Attendance rate', rate === null ? '—' : `${rate}%`],
          ['Student attendance records', rows.length],
          ['Students represented', new Set(rows.map((r) => r.student_id)).size],
          ['Absent records', rows.filter((r) => r.status === 'absent').length],
        ].map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {['Date', 'Student', 'Roll number', 'Subject', 'Status', 'Recorded by'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 200).map((r) => (
              <tr key={r.id}>
                <td>{dateLabel(String(r.attendance_date))}</td>
                <td>{String(person(r.student_id)?.full_name || 'Student')}</td>
                <td>{String(person(r.student_id)?.roll_number || '—')}</td>
                <td>
                  {String(
                    subjects.rows.find((s) => s.id === r.subject_id)?.subject_name || 'Subject',
                  )}
                </td>
                <td>{String(r.status)}</td>
                <td>{String(person(r.faculty_id)?.full_name || 'Faculty')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <Empty
            title="No attendance records found"
            text="Adjust your filters, or wait for faculty to record attendance."
          />
        )}
      </div>
      {rows.length > 200 && (
        <p className="muted">
          Showing the latest 200 of {rows.length} matching records. Narrow the date range to view
          earlier records. Summary figures include all matches.
        </p>
      )}
    </>
  );
}
