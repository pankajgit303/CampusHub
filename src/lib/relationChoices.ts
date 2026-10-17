import type { Row, Table } from '../services/data';
import type { Field } from '../features/resources';
export function relationChoices(
  field: Field,
  relations: Partial<Record<Table, Row[]>>,
  values: Record<string, unknown>,
  actor?: { id: string; role: string } | null,
) {
  const subject = relations.subjects?.find((s) => s.id === values.subject_id);
  return (field.relation ? relations[field.relation] || [] : []).filter((r) => {
    if (
      field.relation === 'courses' &&
      (!values.department_id || r.department_id !== values.department_id)
    )
      return false;
    if (
      field.relation === 'semesters' &&
      'course_id' in values &&
      (r.course_id || '') !== (values.course_id || '')
    )
      return false;
    if (field.relation === 'profiles') {
      if (field.key === 'student_id')
        return (
          r.role === 'student' &&
          r.account_status === 'active' &&
          (!subject ||
            (r.department_id === subject.department_id && r.semester_id === subject.semester_id))
        );
      if (['faculty_id', 'assigned_to'].includes(field.key))
        return r.role === 'faculty' && r.account_status === 'active';
    }
    if (
      field.relation === 'semesters' &&
      values.department_id &&
      r.department_id !== values.department_id
    )
      return false;
    if (field.relation === 'subjects') {
      if (actor?.role === 'faculty' && r.faculty_id !== actor.id) return false;
      if (values.department_id && r.department_id !== values.department_id) return false;
      if (values.semester_id && r.semester_id !== values.semester_id) return false;
    }
    if (field.relation === 'exams' && values.subject_id && r.subject_id !== values.subject_id)
      return false;
    return true;
  });
}
