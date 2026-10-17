import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./data', () => ({ list: vi.fn() }));
import { list } from './data';
import { campusAnswer } from './campusAssistant';
const mock = vi.mocked(list);
beforeEach(() => mock.mockReset());
describe('campus data assistant', () => {
  it('does not invent answers for unsupported requests', async () => {
    mock.mockResolvedValue([]);
    expect((await campusAnswer('Write an essay', { id: 's', role: 'student' })).answer).toContain(
      'I do not generate answers',
    );
  });
  it('reports campus attendance for admins rather than their personal attendance', async () => {
    mock.mockImplementation(async (table) =>
      table === 'attendance'
        ? [
            { id: '1', student_id: 's', status: 'present' },
            { id: '2', student_id: 's', status: 'absent' },
          ]
        : [],
    );
    expect((await campusAnswer('attendance', { id: 'admin', role: 'admin' })).answer).toContain(
      '50%',
    );
  });
  it('excludes submitted student assignments', async () => {
    mock.mockImplementation(async (table) =>
      table === 'assignments'
        ? [{ id: 'a', title: 'Completed', due_date: '2099-01-01' }]
        : table === 'assignment_submissions'
          ? [{ id: 'x', assignment_id: 'a', student_id: 's' }]
          : [],
    );
    expect((await campusAnswer('assignments', { id: 's', role: 'student' })).answer).toBe(
      'No outstanding assignments are available.',
    );
  });
  it('recognizes exam schedules before generic timetable requests', async () => {
    mock.mockResolvedValue([]);
    const r = await campusAnswer('exam schedule', { id: 's', role: 'student' });
    expect(r.sources[0].path).toBe('/app/exams');
  });
});
