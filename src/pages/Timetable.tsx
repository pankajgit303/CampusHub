import { useState } from 'react';
import { CalendarDays, MapPin, Clock3, Settings2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTable } from '../hooks/useTable';
import { PageHeading, Empty, Loading } from '../components/Shared';
import { Button } from '../components/ui/button';
import ResourcePage from './ResourcePage';
export default function Timetable() {
  const { profile } = useAuth();
  const timetable = useTable('timetable');
  const subjects = useTable('subjects');
  const faculty = useTable('faculty_directory');
  const [manage, setManage] = useState(false);
  const now = new Date();
  const clock = now.toTimeString().slice(0, 8);
  if (manage)
    return (
      <>
        <Button variant="outline" onClick={() => setManage(false)}>
          ← Weekly view
        </Button>
        <ResourcePage name="timetable" />
      </>
    );
  return (
    <>
      <PageHeading
        title={profile?.role === 'admin' ? 'Campus timetable' : 'Your week, at a glance.'}
        description={
          profile?.role === 'admin'
            ? 'Coordinate class schedules, rooms and faculty assignments across the campus.'
            : 'View your weekly class schedule.'
        }
        action={
          profile?.role === 'admin' ? (
            <Button onClick={() => setManage(true)}>
              <Settings2 size={17} />
              Manage timetable
            </Button>
          ) : (
            <span className="badge">
              <CalendarDays size={15} />
              Weekly schedule
            </span>
          )
        }
      />
      {timetable.error && <p className="error-box">{timetable.error}</p>}
      {timetable.loading ? (
        <Loading />
      ) : (
        <div className="week-grid">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
            <section key={day} className={`day-column ${now.getDay() === i + 1 ? 'today' : ''}`}>
              <header>
                <h3>{day}</h3>
                {now.getDay() === i + 1 && <span>Today</span>}
              </header>
              {timetable.rows
                .filter((r) => Number(r.day_of_week) === i + 1)
                .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)))
                .map((r) => (
                  <article
                    className={`class-card ${now.getDay() === i + 1 && clock >= String(r.start_time) && clock < String(r.end_time) ? 'current-class' : ''}`}
                    key={r.id}
                  >
                    <span className="eyebrow">
                      {String(
                        subjects.rows.find((s) => s.id === r.subject_id)?.subject_code || 'CLASS',
                      )}
                    </span>
                    <h3>
                      {String(
                        subjects.rows.find((s) => s.id === r.subject_id)?.subject_name || 'Subject',
                      )}
                    </h3>
                    <p>
                      {String(
                        faculty.rows.find((p) => p.id === r.faculty_id)?.full_name ||
                          'Assigned faculty',
                      )}
                    </p>
                    <small>
                      <Clock3 size={13} />
                      {String(r.start_time).slice(0, 5)} – {String(r.end_time).slice(0, 5)}
                    </small>
                    <small>
                      <MapPin size={13} />
                      {String(r.room_number)}
                    </small>
                  </article>
                ))}
              {!timetable.rows.some((r) => Number(r.day_of_week) === i + 1) && (
                <p className="day-empty">No classes</p>
              )}
            </section>
          ))}
        </div>
      )}
      {!timetable.rows.length && !timetable.loading && (
        <Empty
          title="Your timetable is on its way"
          text="Scheduled classes will appear once your college publishes them."
        />
      )}
    </>
  );
}
