import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,x-client-info,apikey,content-type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return json({ error: 'Sign in to use Campus AI.' }, 401);
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const {
    data: { user },
    error,
  } = await client.auth.getUser(auth.slice(7));
  if (error || !user)
    return json({ error: 'Your session has expired. Please sign in again.' }, 401);
  const { data: profile } = await client
    .from('profiles')
    .select('id,role,account_status')
    .eq('id', user.id)
    .single();
  if (!profile || profile.account_status !== 'active')
    return json({ error: 'An active college account is required.' }, 403);
  try {
    const budget = await client.rpc('consume_ai_request');
    if (budget.error)
      return json(
        { error: 'You have reached the assistant request limit. Try again in a minute.' },
        429,
      );
    const body = await req.text();
    if (body.length > 6000)
      return json({ error: 'Please keep your question under 2,000 characters.' }, 413);
    const { question } = JSON.parse(body);
    if (typeof question !== 'string' || !question.trim() || question.length > 2000)
      return json({ error: 'Enter a question of 1–2,000 characters.' }, 400);
    const q = question.toLowerCase();
    let table = 'notices';
    let label = 'Notice board';
    let fields = 'title,content,priority,created_at';
    let path = 'notices';
    if (/attendan|present|absent/.test(q)) {
      table = 'attendance';
      label = 'Your attendance';
      fields = 'attendance_date,status,subject_id';
      path = 'attendance';
    } else if (/assignment|due|deadline|homework/.test(q)) {
      table = 'assignments';
      label = 'Assignments';
      fields = 'title,description,due_date,subject_id,max_marks';
      path = 'assignments';
    } else if (/class|timetable|schedule/.test(q)) {
      table = 'timetable';
      label = 'Class timetable';
      fields = 'day_of_week,start_time,end_time,room_number,subject_id';
      path = 'timetable';
    } else if (/exam/.test(q) && !/notice/.test(q)) {
      table = 'exams';
      label = 'Examinations';
      fields = 'title,exam_date,start_time,room_number,subject_id';
      path = 'exams';
    } else if (/material|notes|resource/.test(q)) {
      table = 'study_materials';
      label = 'Study materials';
      fields = 'title,description,subject_id';
      path = 'materials';
    } else if (/rule|policy/.test(q)) {
      table = 'ai_documents';
      label = 'College knowledge base';
      fields = 'title,content';
      path = 'ai';
    }
    const { data: subjects } = await client
      .from('subjects')
      .select('id,subject_name,subject_code')
      .limit(100);
    let query = client.from(table).select(fields);
    if (table === 'attendance') query = query.eq('student_id', user.id);
    if (table === 'assignments')
      query = query.gte('due_date', new Date().toISOString()).order('due_date');
    if (table === 'exams')
      query = query.gte('exam_date', new Date().toISOString().slice(0, 10)).order('exam_date');
    if (table === 'notices') query = query.order('created_at', { ascending: false }).limit(10);
    let rows: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error: readError } = await query.range(offset, offset + 999);
      if (readError) throw readError;
      const page = (data || []) as unknown as Record<string, unknown>[];
      rows.push(...page);
      if (page.length < 1000) break;
    }
    const subject = subjects?.find(
      (s: { subject_name: string; subject_code: string }) =>
        q.includes(s.subject_name.toLowerCase()) ||
        q.includes(s.subject_code.toLowerCase()) ||
        (q.includes('dbms') && s.subject_name.toLowerCase().includes('database')),
    );
    if (subject && fields.includes('subject_id'))
      rows = rows.filter((r) => r.subject_id === subject.id);
    const context = rows.map((r) => ({
      ...r,
      ...(r.subject_id
        ? {
            subject:
              subjects?.find((s: { id: string }) => s.id === r.subject_id)?.subject_name ||
              'Subject',
          }
        : {}),
    }));
    let answer = '';
    if (!rows.length)
      answer =
        'There are no accessible records for this question yet. Your college may still need to publish them or assign your department and semester.';
    else if (table === 'attendance') {
      const present = rows.filter((r) => r.status === 'present').length;
      answer = `Your${subject ? ' ' + subject.subject_name : ''} attendance is ${Math.round((present / rows.length) * 100)}%: ${present} present out of ${rows.length} recorded classes. Only present classes count in this calculation.`;
    } else if (table === 'timetable' && /next|today/.test(q)) {
      const local = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = local.getDay() || 7;
      const minutes = local.getHours() * 60 + local.getMinutes();
      const sorted = context
        .map((r) => ({
          ...r,
          wait:
            ((Number(r.day_of_week) - day) * 1440 +
              Number(String(r.start_time).slice(0, 2)) * 60 +
              Number(String(r.start_time).slice(3, 5)) -
              minutes +
              10080) %
            10080,
        }))
        .sort((a, b) => a.wait - b.wait);
      const next = sorted[0];
      answer = next
        ? `Your next scheduled class is ${next.subject}, ${['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][Number(next.day_of_week)]} at ${next.start_time}, room ${next.room_number}. Times use Asia/Kolkata.`
        : 'No upcoming classes are scheduled.';
    } else if (table === 'timetable')
      answer =
        'Your weekly classes:\n' +
        context
          .map(
            (r) =>
              `• ${['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][Number(r.day_of_week)]}, ${r.start_time}–${r.end_time}: ${r.subject} in ${r.room_number}.`,
          )
          .join('\n');
    else
      answer =
        label +
        ':\n' +
        context
          .slice(0, 10)
          .map(
            (r) =>
              `• ${r.title}${r.due_date ? ' — due ' + r.due_date : ''}${r.exam_date ? ' — ' + r.exam_date : ''}${r.content ? ': ' + String(r.content).slice(0, 1500) : r.description ? ': ' + String(r.description).slice(0, 600) : ''}`,
          )
          .join('\n');
    const mode = 'lookup';
    return json({ answer, mode, sources: [{ label, path: '/app/' + path }], truncated: false });
  } catch {
    return json({ error: 'Campus AI could not complete that request. Please try again.' }, 500);
  }
});
