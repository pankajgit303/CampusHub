import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.CAMPUSHUB_DEMO_PASSWORD;
if (!url || !key || !password || password.length < 16)
  throw new Error(
    'Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and a unique CAMPUSHUB_DEMO_PASSWORD of at least 16 characters in your server environment. Never use a VITE_ prefix for these secrets.',
  );
const db = createClient(url, key, { auth: { persistSession: false } });
const check = ({ data, error }) => {
  if (error) throw error;
  return data;
};
const department = check(await db.from('departments').select('id').eq('code', 'BCA').single());
const semester = check(
  await db
    .from('semesters')
    .select('id')
    .eq('department_id', department.id)
    .eq('semester_number', 1)
    .single(),
);
const users = {};
for (const role of ['student', 'faculty', 'admin']) {
  const result = await db.auth.admin.createUser({
    email: `${role}@campushub.demo`,
    password,
    email_confirm: true,
    user_metadata: { full_name: `CampusHub Demo ${role[0].toUpperCase() + role.slice(1)}` },
  });
  if (result.error)
    throw new Error(
      `Could not create ${role} demo account: ${result.error.message}. This script is intentionally non-destructive; existing accounts are not reset.`,
    );
  users[role] = result.data.user.id;
  check(
    await db
      .from('profiles')
      .update({
        role,
        department_id: department.id,
        semester_id: semester.id,
        ...(role === 'student' ? { roll_number: 'DEMO-BCA-001' } : {}),
      })
      .eq('id', users[role]),
  );
}
const subjects = check(
  await db
    .from('subjects')
    .select('*')
    .eq('department_id', department.id)
    .eq('semester_id', semester.id),
);
for (const subject of subjects)
  check(await db.from('subjects').update({ faculty_id: users.faculty }).eq('id', subject.id));
const future = (days) => new Date(Date.now() + days * 86400000).toISOString();
const assignment = check(
  await db
    .from('assignments')
    .insert({
      title: 'Design a campus library database',
      description:
        'Create a normalised relational schema for books, members and loans. Include an ER diagram and explain your design decisions.',
      subject_id: subjects.find((s) => s.subject_code === 'BCA103').id,
      faculty_id: users.faculty,
      due_date: future(7),
      max_marks: 30,
    })
    .select()
    .single(),
);
check(
  await db
    .from('notices')
    .insert({
      title: 'Welcome to the CampusHub demonstration workspace',
      content:
        'These records are explicitly seeded demo content. Replace them with your college’s information before launch.',
      author_id: users.admin,
      target_role: 'all',
      priority: 'important',
    }),
);
check(
  await db
    .from('events')
    .insert({
      title: 'Campus Coding Circle',
      description: 'A demo event for collaborative problem solving and student projects.',
      event_date: future(10),
      location: 'Lab-201',
      created_by: users.admin,
    }),
);
check(
  await db
    .from('timetable')
    .insert(
      subjects
        .slice(0, 5)
        .map((s, i) => ({
          department_id: department.id,
          semester_id: semester.id,
          subject_id: s.id,
          faculty_id: users.faculty,
          room_number: 'A-101',
          day_of_week: i + 1,
          start_time: '09:00',
          end_time: '10:00',
        })),
    ),
);
check(
  await db
    .from('attendance')
    .insert(
      Array.from({ length: 12 }, (_, i) => ({
        student_id: users.student,
        subject_id: subjects[i % subjects.length].id,
        faculty_id: users.faculty,
        attendance_date: new Date(Date.now() - (i + 1) * 86400000).toISOString().slice(0, 10),
        status: i % 5 === 0 ? 'absent' : 'present',
      })),
    ),
);
const exam = check(
  await db
    .from('exams')
    .insert({
      title: 'Database fundamentals — midterm',
      subject_id: subjects.find((s) => s.subject_code === 'BCA103').id,
      semester_id: semester.id,
      exam_date: future(14).slice(0, 10),
      start_time: '10:00',
      duration_minutes: 90,
      room_number: 'A-101',
      max_marks: 50,
    })
    .select()
    .single(),
);
console.log(
  'Demo accounts and labelled sample records created. Sign in with the password supplied through CAMPUSHUB_DEMO_PASSWORD.',
);
console.log('Emails: student@campushub.demo, faculty@campushub.demo, admin@campushub.demo');
