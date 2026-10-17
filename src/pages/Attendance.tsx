import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCheck, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTable } from '../hooks/useTable';
import { supabase } from '../lib/supabase';
import { attendanceRate, dateLabel } from '../lib/utils';
import { PageHeading, Empty, Loading } from '../components/Shared';
import { Button } from '../components/ui/button';
import { AttendanceReports } from '../components/AttendanceReports';
export default function Attendance() {
  const { profile } = useAuth();
  const subjects = useTable('subjects');
  const attendance = useTable('attendance');
  const people = useTable('profiles');
  const settings = useTable('settings');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const selected = subjects.rows.find((s) => s.id === subject);
  const students = people.rows.filter(
    (p) =>
      p.role === 'student' &&
      p.account_status === 'active' &&
      p.semester_id === selected?.semester_id &&
      p.department_id === selected?.department_id,
  );
  const rate = attendanceRate(attendance.rows);
  const minimum = Number(settings.rows.find((s) => s.name === 'minimum_attendance')?.value || 75);
  return (
    <>
      <PageHeading
        title={profile?.role === 'admin' ? 'Attendance reports' : 'Attendance'}
        description={
          profile?.role === 'admin'
            ? 'Monitor student attendance by subject and date. Attendance is recorded by faculty.'
            : profile?.role === 'faculty'
              ? 'Record attendance for students in your assigned subjects.'
              : 'Keep track of your recorded class attendance.'
        }
      />
      {attendance.error && <p className="error-box">{attendance.error}</p>}
      {profile?.role === 'admin' ? (
        <AttendanceReports />
      ) : profile?.role === 'student' ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <CheckCheck className="text-purple" />
              <span>Overall attendance</span>
              <strong>{rate === null ? '—' : `${rate}%`}</strong>
              <small>
                {attendance.rows.filter((a) => a.status === 'present').length} present /{' '}
                {attendance.rows.length} recorded
              </small>
            </div>
          </div>
          {rate !== null && rate < minimum && (
            <p className="warning-box">
              Your attendance is below the {minimum}% minimum. Contact your faculty for guidance.
            </p>
          )}
          <div className="resource-grid">
            {subjects.rows.map((s) => {
              const rows = attendance.rows.filter((a) => a.subject_id === s.id);
              const p = attendanceRate(rows);
              return (
                <div className="panel" key={s.id}>
                  <span className="eyebrow">{String(s.subject_code)}</span>
                  <h3>{String(s.subject_name)}</h3>
                  <strong
                    className={`attendance-number ${p === null ? '' : p >= 75 ? 'green' : p >= 65 ? 'amber' : 'red'}`}
                  >
                    {p === null ? '—' : `${p}%`}
                  </strong>
                  <div className="progress-track">
                    <div style={{ width: `${p || 0}%` }} />
                  </div>
                  <p className="muted">
                    {rows.filter((a) => a.status === 'present').length} / {rows.length} classes
                    present
                  </p>
                </div>
              );
            })}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.rows
                  .sort((a, b) =>
                    String(b.attendance_date).localeCompare(String(a.attendance_date)),
                  )
                  .map((a) => (
                    <tr key={a.id}>
                      <td>{dateLabel(String(a.attendance_date))}</td>
                      <td>
                        {String(
                          subjects.rows.find((s) => s.id === a.subject_id)?.subject_name ||
                            'Subject',
                        )}
                      </td>
                      <td>
                        <span className="badge">{String(a.status)}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!attendance.rows.length && <Empty title="No attendance recorded yet" />}
          </div>
        </>
      ) : (
        <div className="panel">
          <h2>Mark class attendance</h2>
          <div className="resource-toolbar">
            <label>
              Subject
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setMarks({});
                }}
              >
                <option value="">Choose a subject</option>
                {subjects.rows
                  .filter((s) => s.faculty_id === profile?.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {String(s.subject_name)}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Class date
              <input
                type="date"
                required
                value={date}
                max={new Date().toLocaleDateString('en-CA')}
                onChange={(e) => {
                  setDate(e.target.value);
                  setMarks({});
                }}
              />
            </label>
          </div>
          {people.loading ? (
            <Loading />
          ) : !selected ? (
            <Empty title="Choose a class to begin" />
          ) : !students.length ? (
            <Empty
              title="No students assigned"
              text="Ask your administrator to assign students to this subject’s department and semester."
            />
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll number</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => {
                      const existing = attendance.rows.find(
                        (a) =>
                          a.student_id === s.id &&
                          a.subject_id === subject &&
                          a.attendance_date === date,
                      );
                      return (
                        <tr key={s.id}>
                          <td>{String(s.full_name)}</td>
                          <td>{String(s.roll_number || '—')}</td>
                          <td>
                            <select
                              aria-label={`Attendance for ${s.full_name}`}
                              value={marks[s.id] || String(existing?.status || '')}
                              onChange={(e) => setMarks({ ...marks, [s.id]: e.target.value })}
                            >
                              <option value="">Not marked</option>
                              {['present', 'absent', 'late', 'excused'].map((v) => (
                                <option key={v}>{v}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Button
                disabled={busy || !Object.keys(marks).length || !date}
                onClick={async () => {
                  if (profile?.role !== 'faculty') return;
                  setBusy(true);
                  try {
                    const values = Object.entries(marks)
                      .filter(([, status]) => status)
                      .map(([student_id, status]) => ({
                        student_id,
                        status,
                        subject_id: subject,
                        faculty_id: profile.id,
                        attendance_date: date,
                      }));
                    const { error } = await supabase
                      .from('attendance')
                      .upsert(values, { onConflict: 'student_id,subject_id,attendance_date' });
                    if (error) throw error;
                    setMarks({});
                    await attendance.refresh();
                    toast.success('Attendance saved');
                  } catch (e) {
                    toast.error((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Save size={17} />
                {busy ? 'Saving…' : 'Save attendance'}
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
