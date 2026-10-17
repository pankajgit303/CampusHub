import type { Table } from '../services/data';
export type Role = 'student' | 'faculty' | 'admin';
export type Field = {
  key: string;
  label: string;
  type?:
    'text' | 'textarea' | 'number' | 'date' | 'datetime-local' | 'time' | 'select' | 'file' | 'url';
  required?: boolean;
  options?: string[];
  optionLabels?: Record<string, string>;
  defaultValue?: string;
  emptyLabel?: string;
  virtual?: boolean;
  relation?: Table;
  bucket?: string;
  min?: number;
  max?: number;
};
export type Resource = {
  table: Table;
  title: string;
  singular: string;
  description: string;
  fields: Field[];
  columns: string[];
  create: Role[];
  edit: Role[];
  delete: Role[];
  defaults?: Record<string, string>;
  cards?: boolean;
};
const field = (
  key: string,
  label: string,
  type: Field['type'] = 'text',
  extra: Partial<Field> = {},
): Field => ({ key, label, type, required: true, ...extra });
const rel = (key: string, label: string, relation: Table, required = true) =>
  field(key, label, 'select', { relation, required });
const option = (key: string, label: string, options: string[], required = true) =>
  field(key, label, 'select', { options, required });
const dept = rel('department_id', 'Department', 'departments');
const course = rel('course_id', 'Course', 'courses');
const courseFilter = {
  ...course,
  virtual: true,
  required: false,
  emptyLabel: 'No course assigned',
};
const semester = rel('semester_id', 'Semester', 'semesters');
const subject = rel('subject_id', 'Subject', 'subjects');
const faculty = rel('faculty_id', 'Faculty member', 'profiles');
const student = rel('student_id', 'Student', 'profiles');
const description = field('description', 'Description', 'textarea');
const title = field('title', 'Title');
const file = (key: string, label: string, bucket: string, required = false) =>
  field(key, label, 'file', { bucket, required });
const priority = option('priority', 'Priority', ['normal', 'important', 'urgent']);
const admin: Role[] = ['admin'];
const staff: Role[] = ['faculty', 'admin'];
const resource = (
  table: Table,
  title: string,
  singular: string,
  fields: Field[],
  columns: string[],
  extra: Partial<Resource> = {},
): Resource => ({
  table,
  title,
  singular,
  fields,
  columns,
  description: `Your campus ${title.toLowerCase()}, organised in one place.`,
  create: admin,
  edit: admin,
  delete: admin,
  ...extra,
});
export const resources: Record<string, Resource> = {
  departments: resource(
    'departments',
    'Departments',
    'department',
    [field('name', 'Name'), field('code', 'Code'), { ...description, required: false }],
    ['name', 'code', 'description'],
  ),
  courses: resource(
    'courses',
    'Courses',
    'course',
    [
      field('name', 'Name'),
      dept,
      field('duration_years', 'Duration in years', 'number', { min: 1, max: 10 }),
    ],
    ['name', 'department_id', 'duration_years'],
  ),
  semesters: resource(
    'semesters',
    'Semesters',
    'semester',
    [
      dept,
      course,
      field('semester_number', 'Semester number', 'number', { min: 1, max: 12 }),
      field('academic_year', 'Academic year'),
    ],
    ['department_id', 'course_id', 'semester_number', 'academic_year'],
  ),
  classrooms: resource(
    'classrooms',
    'Classrooms',
    'classroom',
    [
      field('name', 'Room name'),
      field('building', 'Building'),
      field('capacity', 'Capacity', 'number', { min: 1 }),
    ],
    ['name', 'building', 'capacity'],
  ),
  subjects: resource(
    'subjects',
    'Subjects',
    'subject',
    [
      field('subject_name', 'Subject name'),
      field('subject_code', 'Subject code'),
      dept,
      courseFilter,
      semester,
      { ...faculty, required: false },
      field('credits', 'Credits', 'number', { min: 1 }),
    ],
    ['subject_name', 'subject_code', 'course_id', 'semester_id', 'faculty_id', 'credits'],
  ),
  people: resource(
    'profiles',
    'People',
    'account',
    [
      field('full_name', 'Full name'),
      field('phone', 'Phone', 'text', { required: false }),
      option('role', 'Role', ['student', 'faculty', 'admin']),
      { ...dept, required: false },
      courseFilter,
      { ...semester, required: false },
      field('roll_number', 'Roll number', 'text', { required: false }),
      field('registration_number', 'Registration number', 'text', { required: false }),
      option('account_status', 'Account status', ['active', 'inactive']),
    ],
    ['full_name', 'email', 'role', 'department_id', 'course_id', 'semester_id', 'account_status'],
    {
      create: [],
      delete: [],
      description:
        'Manage registered students and faculty. New users join through verified email signup.',
    },
  ),
  assignments: resource(
    'assignments',
    'Assignments',
    'assignment',
    [
      title,
      description,
      subject,
      field('due_date', 'Due date', 'datetime-local'),
      field('max_marks', 'Maximum marks', 'number', { min: 1 }),
      file('attachment_url', 'Attachment', 'assignments'),
    ],
    ['title', 'subject_id', 'due_date', 'max_marks'],
    {
      create: staff,
      edit: staff,
      delete: staff,
      defaults: { faculty_id: '$user' },
      cards: true,
      description: 'Make progress, meet deadlines, and put your learning into practice.',
    },
  ),
  materials: resource(
    'study_materials',
    'Study materials',
    'study material',
    [
      title,
      { ...description, required: false },
      subject,
      file('file_url', 'Document', 'study-materials', true),
    ],
    ['title', 'subject_id', 'description', 'file_url'],
    {
      create: staff,
      edit: staff,
      delete: staff,
      defaults: { faculty_id: '$user' },
      cards: true,
      description: 'Your reading list, lecture notes and resources for what comes next.',
    },
  ),
  notices: resource(
    'notices',
    'Notice board',
    'notice',
    [
      title,
      field('content', 'Notice', 'textarea'),
      {
        ...option('target_role', 'Audience', ['all', 'student', 'faculty']),
        defaultValue: 'all',
        optionLabels: { all: 'Students and faculty', student: 'Students', faculty: 'Faculty' },
      },
      { ...dept, required: false, emptyLabel: 'All departments' },
      { ...priority, defaultValue: 'normal' },
      file('attachment_url', 'Attachment', 'notices'),
    ],
    ['title', 'content', 'target_role', 'department_id', 'created_at'],
    {
      create: staff,
      edit: staff,
      delete: staff,
      defaults: { author_id: '$user' },
      cards: true,
      description: 'Stay in the know. The latest from across your campus, live.',
    },
  ),
  timetable: resource(
    'timetable',
    'Timetable',
    'class',
    [
      dept,
      semester,
      subject,
      faculty,
      field('room_number', 'Room'),
      field('day_of_week', 'Day (Monday = 1, Saturday = 6)', 'number', { min: 1, max: 6 }),
      field('start_time', 'Start time', 'time'),
      field('end_time', 'End time', 'time'),
    ],
    ['day_of_week', 'subject_id', 'start_time', 'end_time', 'room_number'],
  ),
  exams: resource(
    'exams',
    'Examinations',
    'exam',
    [
      title,
      subject,
      semester,
      field('exam_date', 'Exam date', 'date'),
      field('start_time', 'Start time', 'time'),
      field('duration_minutes', 'Duration (minutes)', 'number', { min: 1 }),
      field('room_number', 'Room'),
      field('max_marks', 'Maximum marks', 'number', { min: 1 }),
    ],
    ['title', 'subject_id', 'exam_date', 'start_time', 'room_number'],
    { cards: true, description: 'Know what is coming. Plan your preparation with confidence.' },
  ),
  results: resource(
    'results',
    'Results',
    'result',
    [
      student,
      subject,
      rel('exam_id', 'Exam', 'exams'),
      field('marks_obtained', 'Marks obtained', 'number', { min: 0 }),
      field('remarks', 'Remarks', 'textarea', { required: false }),
    ],
    [
      'student_id',
      'subject_id',
      'exam_id',
      'marks_obtained',
      'max_marks',
      'percentage',
      'grade',
      'remarks',
    ],
    {
      create: staff,
      edit: staff,
      delete: staff,
      description: 'Every step forward, in perspective. Explore your academic performance.',
    },
  ),
  events: resource(
    'events',
    'Campus events',
    'event',
    [
      title,
      description,
      field('event_date', 'Date & time', 'datetime-local'),
      field('location', 'Location'),
      file('image_url', 'Event image', 'event-images'),
    ],
    ['title', 'event_date', 'location', 'description'],
    {
      defaults: { created_by: '$user' },
      cards: true,
      description: 'Beyond the classroom. Find your people, try something new, make a memory.',
    },
  ),
  placements: resource(
    'placements',
    'Career opportunities',
    'opportunity',
    [
      field('company_name', 'Company'),
      field('role_name', 'Job role'),
      description,
      field('salary_package', 'Annual package (LPA)', 'number', { min: 0 }),
      field('eligibility', 'Eligibility'),
      { ...dept, required: false },
      field('deadline', 'Application deadline', 'date'),
      field('application_url', 'Application URL', 'url'),
      field('company_logo', 'Company logo URL', 'url', { required: false }),
    ],
    ['company_name', 'role_name', 'salary_package', 'eligibility', 'deadline'],
    { cards: true, description: 'Your next chapter starts here. Explore opportunities to grow.' },
  ),
  complaints: resource(
    'complaints',
    'Grievances',
    'grievance',
    [
      title,
      description,
      option('category', 'Category', [
        'Academic',
        'Examination',
        'Infrastructure',
        'Hostel',
        'Library',
        'Faculty',
        'Administration',
        'Other',
      ]),
      priority,
    ],
    ['title', 'category', 'status', 'created_at', 'admin_response'],
    {
      create: ['student'],
      edit: staff,
      delete: admin,
      defaults: { student_id: '$user' },
      cards: true,
      description: 'Your voice matters. Raise a concern and follow its progress.',
    },
  ),
  grading: resource(
    'grading_rules',
    'Grading rules',
    'grading rule',
    [
      field('grade', 'Grade'),
      field('min_percentage', 'Minimum percentage', 'number', { min: 0, max: 100 }),
      field('grade_points', 'Grade points', 'number', { min: 0, max: 10 }),
    ],
    ['grade', 'min_percentage', 'grade_points'],
    { create: staff, edit: staff, delete: staff },
  ),
  settings: resource(
    'settings',
    'Platform settings',
    'setting',
    [field('name', 'Setting name'), field('value', 'Value', 'number')],
    ['name', 'value'],
  ),
  documents: resource(
    'ai_documents',
    'Knowledge base',
    'document',
    [
      title,
      field('source_type', 'Source type'),
      field('content', 'Content', 'textarea'),
      { ...dept, required: false },
    ],
    ['title', 'source_type', 'created_at'],
  ),
  audit: resource(
    'audit_logs',
    'Audit log',
    'audit entry',
    [],
    ['created_at', 'user_id', 'action', 'entity_type', 'entity_id'],
    {
      create: [],
      edit: [],
      delete: [],
      description: 'A record of important changes made by your college team.',
    },
  ),
};
export function displayName(row: Record<string, unknown>): string {
  return String(
    row.full_name ||
      row.subject_name ||
      row.name ||
      row.title ||
      row.company_name ||
      row.grade ||
      (row.semester_number ? `Semester ${row.semester_number} · ${row.academic_year}` : row.id),
  );
}
