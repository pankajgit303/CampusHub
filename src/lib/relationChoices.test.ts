import { describe, expect, it } from 'vitest';
import { relationChoices } from './relationChoices';
import type { Row } from '../services/data';
const rows = {
  profiles: [
    { id: 'f', role: 'faculty', account_status: 'active' },
    { id: 'a', role: 'admin', account_status: 'active' },
    { id: 'inactive', role: 'faculty', account_status: 'inactive' },
    { id: 's', role: 'student', account_status: 'active', department_id: 'd', semester_id: 'sem' },
    {
      id: 'other',
      role: 'student',
      account_status: 'active',
      department_id: 'other',
      semester_id: 'other',
    },
  ] as Row[],
  subjects: [
    { id: 'subject', faculty_id: 'f', department_id: 'd', semester_id: 'sem' },
    { id: 'other-subject', faculty_id: 'other', department_id: 'other', semester_id: 'other' },
  ] as Row[],
  semesters: [
    { id: 'sem', department_id: 'd' },
    { id: 'other', department_id: 'other' },
  ] as Row[],
  exams: [
    { id: 'exam', subject_id: 'subject' },
    { id: 'other-exam', subject_id: 'other-subject' },
  ] as Row[],
};
describe('role and academic form choices', () => {
  it('keeps courses and semesters in the selected department and course', () => {
    const academic = {
      courses: [
        { id: 'bca', department_id: 'd' },
        { id: 'mca', department_id: 'd' },
        { id: 'bba', department_id: 'business' },
      ],
      semesters: [
        { id: 'bca-1', department_id: 'd', course_id: 'bca' },
        { id: 'mca-1', department_id: 'd', course_id: 'mca' },
        { id: 'legacy', department_id: 'd', course_id: null },
      ],
    };
    expect(
      relationChoices({ key: 'course_id', label: 'Course', relation: 'courses' }, academic, {
        department_id: 'd',
      }).map((r) => r.id),
    ).toEqual(['bca', 'mca']);
    expect(
      relationChoices({ key: 'semester_id', label: 'Semester', relation: 'semesters' }, academic, {
        department_id: 'd',
        course_id: 'bca',
      }).map((r) => r.id),
    ).toEqual(['bca-1']);
    expect(
      relationChoices({ key: 'semester_id', label: 'Semester', relation: 'semesters' }, academic, {
        department_id: 'd',
        course_id: '',
      }).map((r) => r.id),
    ).toEqual(['legacy']);
  });
  it('offers only active faculty for teaching and grievance assignment', () => {
    for (const key of ['faculty_id', 'assigned_to'])
      expect(
        relationChoices({ key, label: 'Faculty', relation: 'profiles' }, rows, {}).map((r) => r.id),
      ).toEqual(['f']);
  });
  it('limits semesters to their department', () =>
    expect(
      relationChoices({ key: 'semester_id', label: 'Semester', relation: 'semesters' }, rows, {
        department_id: 'd',
      }).map((r) => r.id),
    ).toEqual(['sem']));
  it('limits faculty to their subjects', () =>
    expect(
      relationChoices(
        { key: 'subject_id', label: 'Subject', relation: 'subjects' },
        rows,
        {},
        { id: 'f', role: 'faculty' },
      ).map((r) => r.id),
    ).toEqual(['subject']));
  it('matches students and exams to the selected subject', () => {
    expect(
      relationChoices({ key: 'student_id', label: 'Student', relation: 'profiles' }, rows, {
        subject_id: 'subject',
      }).map((r) => r.id),
    ).toEqual(['s']);
    expect(
      relationChoices({ key: 'exam_id', label: 'Exam', relation: 'exams' }, rows, {
        subject_id: 'subject',
      }).map((r) => r.id),
    ).toEqual(['exam']);
  });
});
