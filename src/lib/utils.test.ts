import { describe, expect, it } from 'vitest';
import { attendanceRate, safeUrl } from './utils';
describe('academic calculations', () => {
  it('does not invent attendance for an empty class history', () =>
    expect(attendanceRate([])).toBeNull());
  it('counts only present records, including late and excused in the denominator', () =>
    expect(
      attendanceRate([
        { status: 'present' },
        { status: 'late' },
        { status: 'excused' },
        { status: 'absent' },
      ]),
    ).toBe(25));
});
describe('external opportunity links', () => {
  it('rejects executable and insecure links', () => {
    expect(safeUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeUrl('http://example.com')).toBeUndefined();
  });
  it('accepts secure application pages', () =>
    expect(safeUrl('https://example.com/jobs')).toBe('https://example.com/jobs'));
});
