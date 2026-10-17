import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Download, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTable } from '../hooks/useTable';
import { save, upload, download, type Row } from '../services/data';
import { PageHeading, Loading, Empty } from '../components/Shared';
import { Button } from '../components/ui/button';
import { Dialog } from '../components/ui/dialog';
import { dateLabel } from '../lib/utils';
export default function AssignmentDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const assignments = useTable('assignments');
  const submissions = useTable('assignment_submissions');
  const students = useTable('profiles');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [grading, setGrading] = useState<Row>();
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const assignment = assignments.rows.find((r) => r.id === id);
  const mine = submissions.rows.find((r) => r.assignment_id === id && r.student_id === profile?.id);
  const rows = submissions.rows.filter((r) => r.assignment_id === id);
  if (assignments.loading) return <Loading />;
  if (!assignment)
    return (
      <Empty
        title="Assignment unavailable"
        text={assignments.error || 'You may not have access to this assignment.'}
      />
    );
  return (
    <>
      <Link className="back-link" to="/app/assignments">
        ← All assignments
      </Link>
      <PageHeading
        title={String(assignment.title)}
        description={`Due ${dateLabel(String(assignment.due_date))} · ${assignment.max_marks} marks`}
      />
      <div className="panel assignment-description">
        <p>{String(assignment.description)}</p>
        {assignment.attachment_url && (
          <Button
            variant="outline"
            onClick={() =>
              void download('assignments', String(assignment.attachment_url)).catch((e) =>
                toast.error(e.message),
              )
            }
          >
            <Download size={16} />
            Download attachment
          </Button>
        )}
      </div>
      {profile?.role === 'student' ? (
        <div className="panel">
          <h2>Your submission</h2>
          {mine && (
            <div className="submission-status">
              <span className="badge">{String(mine.status)}</span>
              <p>Submitted {dateLabel(String(mine.submitted_at))}</p>
              {mine.marks !== null && (
                <h3>
                  {String(mine.marks)} / {String(assignment.max_marks)} marks
                </h3>
              )}
              <p>{String(mine.feedback || '')}</p>
              {mine.file_url && (
                <Button
                  variant="outline"
                  onClick={() =>
                    void download('submissions', String(mine.file_url)).catch((e) =>
                      toast.error(e.message),
                    )
                  }
                >
                  Download your file
                </Button>
              )}
            </div>
          )}
          {!['graded', 'rejected'].includes(String(mine?.status)) && (
            <form
              className="record-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!profile) return;
                setBusy(true);
                try {
                  const file_url = file
                    ? await upload('submissions', profile.id, file)
                    : mine?.file_url || null;
                  const submission_text = text.trim() || mine?.submission_text || null;
                  if (!file_url && !submission_text)
                    throw new Error('Add an answer or upload a file.');
                  await save(
                    'assignment_submissions',
                    { assignment_id: id, student_id: profile.id, file_url, submission_text },
                    mine?.id,
                  );
                  await submissions.refresh();
                  toast.success('Assignment submitted');
                } catch (e) {
                  toast.error((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Your answer
                <textarea
                  rows={6}
                  placeholder={String(mine?.submission_text || 'Write your response…')}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </label>
              <label>
                Attach your work
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.zip,.png,.jpg"
                  onChange={(e) => setFile(e.target.files?.[0])}
                />
                <small className="muted">
                  Maximum 10 MB. Submissions after the deadline are marked late.
                </small>
              </label>
              <Button type="submit" disabled={busy}>
                <Send size={16} />
                {busy ? 'Submitting…' : mine ? 'Update submission' : 'Submit assignment'}
              </Button>
            </form>
          )}
        </div>
      ) : (
        <div className="panel">
          <h2>Submissions · {rows.length}</h2>
          {submissions.error && <p className="error-box">{submissions.error}</p>}
          {rows.length ? (
            rows.map((r) => (
              <article className="submission-row" key={r.id}>
                <div>
                  <h3>
                    {String(
                      students.rows.find((s) => s.id === r.student_id)?.full_name || 'Student',
                    )}
                  </h3>
                  <span className="badge">{String(r.status)}</span>
                  <p>{String(r.submission_text || 'File submission')}</p>
                  <small>{dateLabel(String(r.submitted_at))}</small>
                </div>
                <div>
                  {r.file_url && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        void download('submissions', String(r.file_url)).catch((e) =>
                          toast.error(e.message),
                        )
                      }
                    >
                      <Download size={16} />
                      File
                    </Button>
                  )}
                  {profile?.role === 'faculty' && (
                    <Button
                      onClick={() => {
                        setGrading(r);
                        setMarks(String(r.marks ?? ''));
                        setFeedback(String(r.feedback || ''));
                      }}
                    >
                      Grade
                    </Button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <Empty title="No submissions yet" />
          )}
        </div>
      )}
      <Dialog
        open={!!grading}
        onOpenChange={(open) => {
          if (!open) setGrading(undefined);
        }}
        title="Grade submission"
      >
        <form
          className="record-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!grading || profile?.role !== 'faculty') return;
            setBusy(true);
            try {
              await save(
                'assignment_submissions',
                { marks: Number(marks), feedback, status: 'graded' },
                grading.id,
              );
              await submissions.refresh();
              setGrading(undefined);
              toast.success('Grade saved and student notified');
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Marks (out of {String(assignment.max_marks)})
            <input
              type="number"
              required
              min="0"
              max={Number(assignment.max_marks)}
              step="any"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
            />
          </label>
          <label>
            Feedback
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </label>
          <Button disabled={busy} type="submit">
            Save grade
          </Button>
        </form>
      </Dialog>
    </>
  );
}
