import { useState } from 'react';
import { toast } from 'sonner';
import { Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { save, upload } from '../services/data';
import { useTable } from '../hooks/useTable';
import { PageHeading } from '../components/Shared';
import { Button } from '../components/ui/button';
export default function Profile() {
  const { profile, refresh } = useAuth();
  const departments = useTable('departments');
  const semesters = useTable('semesters');
  const courses = useTable('courses');
  const [busy, setBusy] = useState(false);
  if (!profile) return null;
  return (
    <>
      <PageHeading
        title="Make yourself at home."
        description="Your profile, preferences and account security."
      />
      <div className="profile-grid">
        <section className="panel">
          <h2>Personal information</h2>
          <form
            className="record-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              setBusy(true);
              try {
                const file = data.get('avatar') as File;
                const avatar_url = file?.size
                  ? await upload('avatars', profile.id, file)
                  : profile.avatar_url;
                await save(
                  'profiles',
                  {
                    full_name: String(data.get('full_name')).trim(),
                    phone: String(data.get('phone')),
                    avatar_url,
                  },
                  profile.id,
                );
                await refresh();
                toast.success('Profile updated');
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Full name
              <input
                name="full_name"
                required
                minLength={2}
                maxLength={120}
                defaultValue={profile.full_name}
              />
            </label>
            <label>
              Email
              <input value={profile.email} readOnly />
            </label>
            <label>
              Phone
              <input name="phone" type="tel" maxLength={25} defaultValue={profile.phone || ''} />
            </label>
            <label>
              Avatar
              <input name="avatar" type="file" accept="image/png,image/jpeg,image/webp" />
              <small className="muted">Private image upload · maximum 10 MB</small>
            </label>
            <Button type="submit" disabled={busy}>
              <Save size={16} />
              Save profile
            </Button>
          </form>
        </section>
        <div>
          <section className="panel">
            <h2>
              {profile.role === 'student'
                ? 'Academic details'
                : profile.role === 'faculty'
                  ? 'Faculty details'
                  : 'Administrator details'}
            </h2>
            <dl className="detail-list">
              {[
                ['Role', profile.role],
                [
                  'Department',
                  departments.rows.find((d) => d.id === profile.department_id)?.name ||
                    'Not assigned',
                ],
                ...(profile.role === 'student'
                  ? [
                      [
                        'Course',
                        courses.rows.find(
                          (c) =>
                            c.id ===
                            semesters.rows.find((s) => s.id === profile.semester_id)?.course_id,
                        )?.name || 'Not assigned',
                      ],
                      [
                        'Semester',
                        semesters.rows.find((s) => s.id === profile.semester_id)?.semester_number ||
                          'Not assigned',
                      ],
                      ['Roll number', profile.roll_number || 'Not assigned'],
                    ]
                  : []),
                ['Status', profile.account_status],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt>{String(k)}</dt>
                  <dd>{String(v)}</dd>
                </div>
              ))}
            </dl>
            <p className="secure-note">
              <ShieldCheck size={15} />
              {profile.role === 'student'
                ? 'Academic details are managed by your administrator.'
                : profile.role === 'faculty'
                  ? 'Your department and faculty access are managed by your administrator.'
                  : 'Manage academic assignments and accounts from People.'}
            </p>
          </section>
          <section className="panel">
            <h2>Change password</h2>
            <form
              className="record-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const password = String(new FormData(form).get('password'));
                setBusy(true);
                const { error } = await supabase.auth.updateUser({ password });
                setBusy(false);
                if (error) toast.error(error.message);
                else {
                  toast.success('Password changed');
                  form.reset();
                }
              }}
            >
              <label>
                New password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
              </label>
              <Button disabled={busy} variant="outline" type="submit">
                Update password
              </Button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
