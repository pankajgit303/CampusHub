import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { list, save, upload, type Row, type Table } from '../services/data';
import { displayName, type Field, type Resource } from '../features/resources';
import { humanize } from '../lib/utils';
import { Button } from './ui/button';
import { Dialog } from './ui/dialog';
import { relationChoices } from '../lib/relationChoices';
export function RecordForm({
  resource,
  record,
  onClose,
  onSaved,
}: {
  resource: Resource;
  record?: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { profile } = useAuth();
  const [relations, setRelations] = useState<Partial<Record<Table, Row[]>>>({});
  const [relationError, setRelationError] = useState('');
  const fields = useMemo(
    (): Field[] =>
      resource.table === 'complaints' && record
        ? [
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: ['submitted', 'under_review', 'in_progress', 'resolved', 'rejected'],
              required: true,
            },
            {
              key: 'admin_response',
              label: 'Response (visible to student)',
              type: 'textarea',
              required: false,
            },
            ...(profile?.role === 'admin'
              ? [
                  {
                    key: 'assigned_to',
                    label: 'Assign to faculty',
                    type: 'select' as const,
                    relation: 'profiles' as const,
                    required: false,
                  },
                ]
              : []),
          ]
        : resource.fields,
    [resource, record, profile?.role],
  );
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, dirtyFields },
  } = useForm<Record<string, unknown>>({
    defaultValues: Object.fromEntries(
      fields.map((f) => [
        f.key,
        f.type === 'datetime-local' && record?.[f.key]
          ? new Date(
              new Date(String(record[f.key])).getTime() -
                new Date(String(record[f.key])).getTimezoneOffset() * 60000,
            )
              .toISOString()
              .slice(0, 16)
          : resource.table === 'notices' &&
              f.key === 'target_role' &&
              !f.options?.includes(String(record?.[f.key]))
            ? f.defaultValue
            : (record?.[f.key] ?? f.defaultValue ?? ''),
      ]),
    ),
  });
  const values = watch();
  // Restore an existing semester after its asynchronously loaded course options render.
  useEffect(() => {
    if (
      record?.semester_id &&
      relations.semesters &&
      !dirtyFields.course_id &&
      !dirtyFields.department_id &&
      !dirtyFields.semester_id
    )
      setValue('semester_id', record.semester_id);
  }, [
    relations.semesters,
    values.course_id,
    record?.semester_id,
    dirtyFields.course_id,
    dirtyFields.department_id,
    dirtyFields.semester_id,
    setValue,
  ]);
  const studentField = (key: string) =>
    ['course_id', 'semester_id', 'roll_number', 'registration_number'].includes(key);
  const shownFields = fields.filter(
    (f) => resource.table !== 'profiles' || values.role === 'student' || !studentField(f.key),
  );
  useEffect(() => {
    void Promise.all(
      [...new Set(fields.flatMap((f) => (f.relation ? [f.relation] : [])))].map(async (table) => {
        const rows = await list(table);
        return [
          table,
          resource.table === 'notices' && table === 'departments' && profile?.role === 'faculty'
            ? rows.filter((r) => r.id === profile.department_id)
            : rows,
        ] as const;
      }),
    )
      .then((pairs) => {
        const loaded = Object.fromEntries(pairs);
        setRelations(loaded);
        if (fields.some((f) => f.key === 'course_id' && f.virtual)) {
          const assignedSemester = loaded.semesters?.find((s: Row) => s.id === record?.semester_id);
          setValue('course_id', assignedSemester?.course_id || '');
        }
      })
      .catch((e) => setRelationError(e.message));
  }, [
    fields,
    resource.table,
    profile?.role,
    profile?.department_id,
    record?.semester_id,
    setValue,
  ]);
  async function submit(values: Record<string, unknown>) {
    if (!profile) return;
    try {
      if (
        fields.some((f) => f.key === 'course_id' && f.virtual) &&
        values.course_id &&
        !values.semester_id &&
        (resource.table !== 'profiles' || values.role === 'student')
      )
        throw new Error(
          'Select a semester to assign this course. Courses are linked through semesters.',
        );
      const payload: Record<string, unknown> = {};
      for (const f of fields) {
        let v = values[f.key];
        if (f.virtual) continue;
        if (resource.table === 'profiles' && values.role !== 'student' && studentField(f.key)) {
          payload[f.key] = null;
          continue;
        }
        if (
          f.relation &&
          v &&
          !relationChoices(f, relations, values, profile).some((r) => r.id === v)
        )
          throw new Error(`Select a valid ${f.label.toLowerCase()} for the current choices.`);
        if (f.type === 'file') {
          const files = v as FileList | undefined;
          if (files?.[0]) v = await upload(f.bucket!, profile.id, files[0]);
          else v = record?.[f.key] || null;
        } else if (f.type === 'number') v = v === '' ? null : Number(v);
        else if (f.type === 'datetime-local' && v) v = new Date(String(v)).toISOString();
        else if (v === '') v = null;
        if (f.required && (v === null || v === undefined || v === ''))
          throw new Error(`${f.label} is required.`);
        if (f.type === 'url' && v)
          z.url()
            .refine((s) => s.startsWith('https://'), 'Use an HTTPS address')
            .parse(v);
        if (f.type === 'number' && v !== null)
          z.number()
            .min(f.min ?? -Infinity)
            .max(f.max ?? Infinity)
            .parse(v);
        if (f.options && v) z.enum(f.options as [string, ...string[]]).parse(v);
        if (typeof v === 'string')
          z.string()
            .max(f.type === 'textarea' ? 20000 : 2000)
            .parse(v);
        payload[f.key] = v;
      }
      if (!record)
        for (const [key, v] of Object.entries(resource.defaults || {}))
          payload[key] = v === '$user' ? profile.id : v;
      await save(resource.table, payload, record?.id);
      toast.success(`${humanize(resource.singular)} saved`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof z.ZodError ? e.issues[0].message : (e as Error).message);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
      title={`${record ? 'Edit' : 'New'} ${resource.singular}`}
      description="Changes are saved securely to your college workspace."
    >
      <form className="record-form" onSubmit={handleSubmit(submit)}>
        {resource.table === 'notices' && (
          <p className="muted">
            {profile?.role === 'faculty'
              ? 'Publish to students in all departments or your own department. Administrators can also review your notices.'
              : 'Choose students, faculty, or both. Leave All departments selected for a campus-wide notice.'}
          </p>
        )}
        {relationError && <p className="error-box">Unable to load choices: {relationError}</p>}
        {shownFields.map((f) => (
          <label key={f.key}>
            {f.label}
            {!f.required && <span className="optional">Optional</span>}
            {f.type === 'textarea' ? (
              <textarea rows={4} {...register(f.key)} />
            ) : f.type === 'select' ? (
              <select
                {...register(f.key, {
                  onChange: () => {
                    if (f.key === 'department_id') {
                      if (fields.some((x) => x.key === 'course_id')) setValue('course_id', '');
                      if (fields.some((x) => x.key === 'semester_id')) setValue('semester_id', '');
                    }
                    if (f.key === 'course_id') setValue('semester_id', '');
                  },
                })}
                required={f.required}
              >
                <option value="">{f.emptyLabel || `Select ${f.label.toLowerCase()}`}</option>
                {f.relation
                  ? relationChoices(f, relations, values, profile).map((r) => (
                      <option key={r.id} value={r.id}>
                        {displayName(r)}
                      </option>
                    ))
                  : f.options?.map((o) => (
                      <option key={o} value={o}>
                        {f.optionLabels?.[o] || humanize(o)}
                      </option>
                    ))}
              </select>
            ) : f.type === 'file' ? (
              <>
                <input
                  type="file"
                  accept={
                    ['avatars', 'event-images'].includes(f.bucket || '')
                      ? 'image/png,image/jpeg,image/webp'
                      : '.pdf,.txt,.docx,.png,.jpg,.jpeg,.webp,.zip'
                  }
                  onChange={(e) => setValue(f.key, e.target.files)}
                />
                <small className="muted">
                  Up to 10 MB. {record?.[f.key] ? 'Leave empty to keep the existing file.' : ''}
                </small>
              </>
            ) : (
              <input
                type={f.type || 'text'}
                required={f.required}
                min={f.min}
                max={f.max}
                step={f.type === 'number' ? 'any' : undefined}
                {...register(f.key)}
              />
            )}
          </label>
        ))}
        <div className="form-actions">
          <Button variant="outline" type="button" disabled={isSubmitting} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !!relationError}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
