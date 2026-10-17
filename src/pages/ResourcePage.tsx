import { StorageImage } from '../components/StorageImage';
import { AddFaculty } from '../components/AddFaculty';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Download,
  ArrowUpRight,
  CalendarDays,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useTable } from '../hooks/useTable';
import { list, remove, save, download, type Row, type Table } from '../services/data';
import { resources, displayName, type Resource } from '../features/resources';
import { dateLabel, humanize, safeUrl } from '../lib/utils';
import { PageHeading, Empty, Loading } from '../components/Shared';
import { Button } from '../components/ui/button';
import { Dialog } from '../components/ui/dialog';
import { RecordForm } from '../components/RecordForm';
const adminDescriptions: Record<string, string> = {
  assignments:
    'Monitor faculty assignments and student submissions across the campus. Faculty create assignments and grade work.',
  materials: 'View teaching resources published by faculty across the campus.',
  results: 'Review student results published by faculty across departments and examinations.',
  exams: 'Manage examination schedules, subjects and maximum marks.',
  events: 'Organise campus events and manage event information.',
  placements: 'Publish and manage placement opportunities for students.',
  complaints: 'Review student grievances, assign reviewers and track resolution.',
  notices:
    'Publish notices for students, faculty, or both. Administrators can manage all campus notices.',
};
const facultyDescriptions: Record<string, string> = {
  notices:
    'Read campus announcements and publish notices for students. You can edit or delete your own notices.',
  assignments: 'Create assignments for your subjects and review student submissions.',
  materials: 'Share lecture notes and teaching resources for your assigned subjects.',
  results: 'Record and review examination results for students in your assigned subjects.',
  exams: 'View examination schedules for your teaching subjects.',
  complaints: 'Review and respond to student grievances assigned to you.',
  grading: 'View the campus grading scale maintained by administrators.',
  events: 'View upcoming campus events and their details.',
  placements: 'View placement opportunities shared with students.',
};
export default function ResourcePage({ name }: { name: string }) {
  const { profile } = useAuth();
  const studentsOnly = name === 'people' && profile?.role === 'faculty';
  const config = useMemo(
    () =>
      studentsOnly
        ? {
            ...resources[name],
            title: 'My students',
            description: 'View student records available for your assigned teaching subjects.',
          }
        : profile?.role === 'admin'
          ? {
              ...resources[name],
              description: adminDescriptions[name] || resources[name].description,
              ...(['assignments', 'materials', 'results'].includes(name)
                ? { create: [], edit: [], delete: [] }
                : {}),
            }
          : profile?.role === 'faculty'
            ? {
                ...resources[name],
                description: facultyDescriptions[name] || resources[name].description,
                ...(name === 'notices'
                  ? {
                      fields: resources[name].fields.map((f) =>
                        f.key === 'target_role'
                          ? { ...f, options: ['student'], defaultValue: 'student' }
                          : f,
                      ),
                    }
                  : {}),
                ...(['grading', 'subjects'].includes(name)
                  ? { create: [], edit: [], delete: [] }
                  : {}),
                ...(name === 'subjects'
                  ? {
                      title: 'My subjects',
                      description: 'Subjects assigned to you, with their course and semester.',
                    }
                  : {}),
              }
            : name === 'subjects'
              ? {
                  ...resources[name],
                  title: 'My subjects',
                  description: 'Subjects for your assigned course and semester.',
                  create: [],
                  edit: [],
                  delete: [],
                }
              : resources[name],
    [name, studentsOnly, profile?.role],
  );
  const { rows: allRows, loading, error, refresh } = useTable(config.table);
  const rows = useMemo(
    () => (studentsOnly ? allRows.filter((row) => row.role === 'student') : allRows),
    [allRows, studentsOnly],
  );
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Row | null | undefined>();
  const [deleting, setDeleting] = useState<Row>();
  const [detail, setDetail] = useState<Row>();
  const [busy, setBusy] = useState(false);
  const [examMarks, setExamMarks] = useState<Record<string, number>>({});
  const [minSalary, setMinSalary] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [lookups, setLookups] = useState<Record<string, string>>({});
  const [semesterCourses, setSemesterCourses] = useState<Record<string, string>>({});
  const [registered, setRegistered] = useState<Row[]>([]);
  const [history, setHistory] = useState<Row[]>([]);
  const canCreate = !!profile && config.create.includes(profile.role);
  const canEdit = !!profile && config.edit.includes(profile.role);
  const canDelete = !!profile && config.delete.includes(profile.role);
  const canManageRow = (r: Row) =>
    profile?.role !== 'faculty' ||
    (name === 'notices'
      ? r.author_id === profile.id
      : ['assignments', 'materials'].includes(name)
        ? r.faculty_id === profile.id
        : name === 'complaints'
          ? r.assigned_to === profile.id
          : true);
  useEffect(() => {
    const tables = [...new Set(config.fields.flatMap((f) => (f.relation ? [f.relation] : [])))];
    void Promise.all(tables.map((t) => list(t)))
      .then((groups) => {
        const semesters = groups[tables.indexOf('semesters')] || [];
        const courses = groups[tables.indexOf('courses')] || [];
        setSemesterCourses(
          Object.fromEntries(semesters.map((s) => [s.id, String(s.course_id || '')])),
        );
        setLookups(
          Object.fromEntries(
            groups
              .flat()
              .map((r) => [
                r.id,
                semesters.includes(r)
                  ? `${courses.find((c) => c.id === r.course_id)?.name || 'Course not assigned'} · ${displayName(r)}`
                  : displayName(r),
              ]),
          ),
        );
      })
      .catch((e) => toast.error(e.message));
  }, [config]);
  useEffect(() => {
    if (name === 'events')
      void list('event_registrations')
        .then(setRegistered)
        .catch((e) => toast.error(e.message));
  }, [name]);
  useEffect(() => {
    if (detail && name === 'complaints')
      void list('complaint_updates')
        .then((all) =>
          setHistory(
            all
              .filter((r) => r.complaint_id === detail.id)
              .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))),
          ),
        )
        .catch((e) => toast.error(e.message));
  }, [detail, name]);
  useEffect(() => {
    if (name === 'results')
      void list('exams')
        .then((exams) =>
          setExamMarks(Object.fromEntries(exams.map((e) => [e.id, Number(e.max_marks)]))),
        )
        .catch((e) => toast.error(e.message));
  }, [name]);
  const filterKey =
    name === 'people'
      ? studentsOnly
        ? 'department_id'
        : 'role'
      : name === 'complaints'
        ? 'status'
        : name === 'notices'
          ? 'priority'
          : config.fields.some((f) => f.key === 'department_id')
            ? 'department_id'
            : config.fields.some((f) => f.key === 'subject_id')
              ? 'subject_id'
              : '';
  const filtered = useMemo(
    () =>
      rows
        .filter(
          (r) =>
            (!minSalary || Number(r.salary_package) >= Number(minSalary)) &&
            (!openOnly || String(r.deadline) >= new Date().toLocaleDateString('en-CA')) &&
            (!filter || String(r[filterKey]) === filter) &&
            Object.values(r).some((v) =>
              `${v ?? ''} ${lookups[String(v)] || ''}`.toLowerCase().includes(search.toLowerCase()),
            ),
        )
        .sort((a, b) =>
          sort === 'name'
            ? displayName(a).localeCompare(displayName(b))
            : sort === 'salary'
              ? Number(b.salary_package) - Number(a.salary_package)
              : sort === 'deadline'
                ? String(a.deadline || a.due_date || '').localeCompare(
                    String(b.deadline || b.due_date || ''),
                  )
                : String(b.created_at || b.id).localeCompare(String(a.created_at || a.id)),
        ),
    [rows, search, filter, filterKey, lookups, sort, minSalary, openOnly],
  );
  const visible = filtered.slice(page * 9, (page + 1) * 9);
  const value = (r: Row, key: string) => {
    if ((name === 'people' || name === 'subjects') && key === 'course_id')
      return name === 'people' && r.role !== 'student'
        ? '—'
        : lookups[semesterCourses[String(r.semester_id)]] || 'Not assigned';
    if (name === 'notices') {
      if (key === 'target_role')
        return (
          (
            {
              all: 'Students and faculty',
              student: 'Students',
              faculty: 'Faculty',
              admin: 'Administrators (legacy audience)',
            } as Record<string, string>
          )[String(r[key])] || 'Unknown audience'
        );
      if (key === 'department_id' && !r[key]) return 'All departments';
      if (key === 'content' || key === 'title') return String(r[key] || '');
    }
    if (key === 'max_marks') return examMarks[String(r.exam_id)] ?? '—';
    if (key === 'percentage')
      return examMarks[String(r.exam_id)]
        ? `${((Number(r.marks_obtained) / examMarks[String(r.exam_id)]) * 100).toFixed(1)}%`
        : '—';
    const v = r[key];
    if (v === null || v === undefined || v === '') return '—';
    if (key.endsWith('_id')) return lookups[String(v)] || 'Assigned record';
    if (key.endsWith('_date') || key.endsWith('_at') || key === 'deadline')
      return dateLabel(String(v));
    if (key === 'day_of_week')
      return ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][Number(v)];
    if (typeof v === 'object') return JSON.stringify(v);
    return humanize(String(v));
  };
  async function registerEvent(row: Row) {
    if (!profile) return;
    setBusy(true);
    try {
      const existing = registered.find((r) => r.event_id === row.id && r.student_id === profile.id);
      if (existing) await remove('event_registrations', existing.id);
      else await save('event_registrations', { event_id: row.id, student_id: profile.id });
      setRegistered(await list('event_registrations'));
      toast.success(existing ? 'Registration cancelled' : 'You’re registered!');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const fileAction = (r: Row) => {
    const f = config.fields.find((f) => f.type === 'file' && r[f.key]);
    return f ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          void download(f.bucket!, String(r[f.key])).catch((e) => toast.error(e.message))
        }
      >
        <Download size={15} />
        Download
      </Button>
    ) : null;
  };
  const actions = (r: Row) => (
    <div className="row-actions">
      <Button variant="ghost" size="sm" onClick={() => setDetail(r)}>
        Details <ArrowUpRight size={14} />
      </Button>
      {fileAction(r)}
      {name === 'assignments' && (
        <Link className="btn btn-outline btn-sm" to={`/app/assignments/${r.id}`}>
          {profile?.role === 'student' ? 'Open & submit' : 'Submissions'}
        </Link>
      )}
      {name === 'events' &&
        profile?.role === 'student' &&
        new Date(String(r.event_date)) > new Date() && (
          <Button
            size="sm"
            variant={registered.some((x) => x.event_id === r.id) ? 'outline' : 'default'}
            disabled={busy}
            onClick={() => void registerEvent(r)}
          >
            {registered.some((x) => x.event_id === r.id) ? 'Cancel registration' : 'Register'}
          </Button>
        )}
      {name === 'placements' &&
        profile?.role === 'student' &&
        safeUrl(String(r.application_url)) && (
          <a
            className="btn btn-outline btn-sm"
            target="_blank"
            rel="noopener noreferrer"
            href={safeUrl(String(r.application_url))}
          >
            Apply <ArrowUpRight size={14} />
          </a>
        )}
      {canEdit && canManageRow(r) && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${displayName(r)}`}
          onClick={() => setEditing(r)}
        >
          <Pencil size={15} />
        </Button>
      )}
      {canDelete && canManageRow(r) && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${displayName(r)}`}
          onClick={() => setDeleting(r)}
        >
          <Trash2 size={15} />
        </Button>
      )}
    </div>
  );
  return (
    <>
      <PageHeading
        title={config.title}
        description={config.description}
        action={
          name === 'people' && profile?.role === 'admin' ? (
            <AddFaculty people={rows} onSaved={refresh} />
          ) : canCreate ? (
            <Button onClick={() => setEditing(null)}>
              <Plus size={18} />
              New {config.singular}
            </Button>
          ) : undefined
        }
      />
      <div className="resource-toolbar">
        <div className="input-icon">
          <Search size={17} />
          <input
            placeholder={`Search ${config.title.toLowerCase()}…`}
            aria-label="Search records"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        {filterKey && (
          <select
            aria-label="Filter records"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All {humanize(filterKey.replace('_id', ''))}</option>
            {[...new Set(rows.map((r) => String(r[filterKey] || '')))].filter(Boolean).map((v) => (
              <option key={v} value={v}>
                {lookups[v] || humanize(v)}
              </option>
            ))}
          </select>
        )}
        <select aria-label="Sort records" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="name">Name A–Z</option>
          {name === 'placements' && (
            <>
              <option value="salary">Highest salary</option>
              <option value="deadline">Nearest deadline</option>
            </>
          )}
        </select>
        <span className="muted">{filtered.length} records</span>
        {name === 'placements' && (
          <>
            <input
              className="salary-filter"
              aria-label="Minimum salary package in LPA"
              type="number"
              min="0"
              placeholder="Minimum LPA"
              value={minSalary}
              onChange={(e) => {
                setMinSalary(e.target.value);
                setPage(0);
              }}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => {
                  setOpenOnly(e.target.checked);
                  setPage(0);
                }}
              />
              Open applications only
            </label>
          </>
        )}
      </div>
      {error ? (
        <div className="error-box">
          {error}
          <Button onClick={() => void refresh()}>Retry</Button>
        </div>
      ) : loading ? (
        <Loading />
      ) : !filtered.length ? (
        <Empty
          title={search ? 'No matching records' : `No ${config.title.toLowerCase()} yet`}
          text={
            studentsOnly
              ? 'No students are available for your assigned subjects. Ask your administrator to check your teaching assignments and student academic details.'
              : canCreate
                ? 'Add your first record to get started.'
                : 'Your college will publish updates here. Check back soon.'
          }
        />
      ) : config.cards ? (
        <div className="resource-grid">
          {visible.map((r, i) => (
            <article
              className={`resource-card ${r.priority === 'urgent' ? 'urgent-card' : ''}`}
              key={r.id}
            >
              {name === 'events' && r.image_url && (
                <StorageImage
                  bucket="event-images"
                  path={String(r.image_url)}
                  alt={String(r.title)}
                  className="event-image"
                />
              )}
              <div className="card-top">
                <span className={`card-icon color-${i % 3}`}>
                  {name === 'events' ? (
                    <CalendarDays size={23} />
                  ) : name === 'placements' ? (
                    <span>{String(r.company_name).slice(0, 2).toUpperCase()}</span>
                  ) : (
                    <FileText size={23} />
                  )}
                </span>
                <span
                  className={`badge ${r.priority === 'urgent' ? 'badge-red' : r.status === 'resolved' ? 'badge-green' : ''}`}
                >
                  {r.priority
                    ? humanize(String(r.priority))
                    : r.status
                      ? humanize(String(r.status))
                      : name === 'events'
                        ? 'Campus life'
                        : name === 'placements'
                          ? 'Opportunity'
                          : 'Academic'}
                </span>
              </div>
              <h3>{displayName(r)}</h3>
              {r.role_name && <h4>{String(r.role_name)}</h4>}
              <p className="card-description">
                {String(r.description || r.content || r.eligibility || '')}
              </p>
              <div className="card-meta">
                {config.columns
                  .filter(
                    (k) =>
                      ![
                        'title',
                        'company_name',
                        'role_name',
                        'description',
                        'content',
                        'admin_response',
                      ].includes(k),
                  )
                  .slice(0, 3)
                  .map((k) => (
                    <span key={k}>
                      {k === 'location' ? <MapPin size={13} /> : <span className="meta-dot" />}
                      {humanize(k.replace('_id', ''))}: {value(r, k)}
                    </span>
                  ))}
              </div>
              {name === 'events' && registered.some((x) => x.event_id === r.id) && (
                <span className="registered">
                  <CheckCircle2 size={14} />
                  You’re on the list
                </span>
              )}
              {actions(r)}
            </article>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {config.columns.map((k) => (
                  <th key={k}>{humanize(k.replace('_id', ''))}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id}>
                  {config.columns.map((k) => (
                    <td key={k}>
                      {['status', 'role', 'account_status', 'grade'].includes(k) ? (
                        <span className="badge">{value(r, k)}</span>
                      ) : (
                        value(r, k)
                      )}
                    </td>
                  ))}
                  <td>{actions(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pagination">
        <span>
          {filtered.length
            ? `${page * 9 + 1}–${Math.min((page + 1) * 9, filtered.length)} of ${filtered.length}`
            : '0 records'}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          <ChevronLeft size={15} />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={(page + 1) * 9 >= filtered.length}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
          <ChevronRight size={15} />
        </Button>
      </div>
      {editing !== undefined && (
        <RecordForm
          resource={config}
          record={editing || undefined}
          onClose={() => setEditing(undefined)}
          onSaved={() => void refresh()}
        />
      )}
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
        title={`Delete ${config.singular}?`}
        description="This permanently removes the record. Related records may prevent deletion."
      >
        <p>{deleting && displayName(deleting)}</p>
        <div className="form-actions">
          <Button variant="outline" onClick={() => setDeleting(undefined)}>
            Keep record
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              if (!deleting) return;
              setBusy(true);
              try {
                await remove(config.table, deleting.id);
                setDeleting(undefined);
                await refresh();
                toast.success('Record deleted');
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Delete record
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(undefined);
        }}
        title={detail ? displayName(detail) : 'Details'}
      >
        <dl className="detail-list">
          {detail &&
            [...new Set([...config.columns, ...config.fields.map((f) => f.key)])]
              .filter(
                (k) =>
                  name !== 'people' ||
                  detail.role === 'student' ||
                  !['course_id', 'semester_id', 'roll_number', 'registration_number'].includes(k),
              )
              .map((k) => (
                <div key={k}>
                  <dt>{humanize(k.replace('_id', ''))}</dt>
                  <dd
                    style={
                      name === 'notices' && k === 'content' ? { whiteSpace: 'pre-wrap' } : undefined
                    }
                  >
                    {config.fields.some((f) => f.key === k && f.type === 'file')
                      ? fileAction(detail)
                      : value(detail, k)}
                  </dd>
                </div>
              ))}
        </dl>
        {name === 'complaints' && (
          <div className="timeline">
            <h3>Progress timeline</h3>
            {history.map((h) => (
              <div key={h.id}>
                <span className="timeline-dot" />
                <b>{humanize(String(h.status))}</b>
                <small>{dateLabel(String(h.created_at))}</small>
                <p>{String(h.response || 'Your concern has been recorded.')}</p>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    </>
  );
}
