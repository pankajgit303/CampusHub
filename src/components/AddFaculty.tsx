import { useState } from 'react';
import { UserPlus, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useTable } from '../hooks/useTable';
import { save, type Row } from '../services/data';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';

export function AddFaculty({ people, onSaved }: { people: Row[]; onSaved: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus size={18} />
        Add faculty
      </Button>
      {open && <FacultyDialog people={people} onSaved={onSaved} onClose={() => setOpen(false)} />}
    </>
  );
}

function FacultyDialog({
  people,
  onSaved,
  onClose,
}: {
  people: Row[];
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const departments = useTable('departments');
  const [account, setAccount] = useState('');
  const [department, setDepartment] = useState('');
  const [busy, setBusy] = useState(false);
  const candidates = people.filter((p) => p.role === 'student' && p.account_status === 'active');
  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
      title="Add faculty"
      description="Give a registered account access to faculty tools."
    >
      <div className="info-banner">
        <div>
          <b>Adding someone new?</b>
          <p>
            Ask them to create an account and verify their email first. Then select their account
            below. No password needs to be shared.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`${location.origin}/auth/signup`);
                toast.success('Signup link copied');
              } catch {
                toast.error(`Share this signup link: ${location.origin}/auth/signup`);
              }
            }}
          >
            <Copy size={14} />
            Copy signup link
          </Button>
        </div>
      </div>
      {departments.error && <p className="error-box">{departments.error}</p>}
      <form
        className="record-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!candidates.some((p) => p.id === account) || !department) return;
          setBusy(true);
          try {
            await save(
              'profiles',
              { role: 'faculty', department_id: department, semester_id: null },
              account,
            );
            await onSaved();
            toast.success('Faculty access added. Assign their teaching subjects under Subjects.');
            onClose();
          } catch (error) {
            toast.error((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Registered account
          <select
            aria-label="Registered account"
            required
            value={account}
            onChange={(event) => {
              setAccount(event.target.value);
              const person = candidates.find((p) => p.id === event.target.value);
              setDepartment(String(person?.department_id || ''));
            }}
          >
            <option value="">Select an account</option>
            {candidates.map((person) => (
              <option key={person.id} value={person.id}>
                {String(person.full_name)} — {String(person.email)}
              </option>
            ))}
          </select>
        </label>
        {!candidates.length && (
          <p className="muted">
            No eligible accounts yet. After the faculty member signs up, refresh the People page to
            see their account.
          </p>
        )}
        <label>
          Department
          <select
            aria-label="Department"
            required
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
          >
            <option value="">Select a department</option>
            {departments.rows.map((d) => (
              <option key={d.id} value={d.id}>
                {String(d.name)}
              </option>
            ))}
          </select>
        </label>
        <p className="muted">
          This changes the selected account’s role to Faculty and clears its student semester. It
          does not grant administrator access.
        </p>
        <div className="form-actions">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={busy || !account || !department || departments.loading || !!departments.error}
          >
            {busy ? 'Adding…' : 'Add faculty access'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
