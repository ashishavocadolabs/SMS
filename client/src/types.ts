export type Role = "student" | "teacher";

export interface User {
  id: number;
  role: Role;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Student extends User {
  phone?: string;
}

export interface Teacher extends User {
  phone?: string;
}

export interface StudentRecord {
  student_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export interface TeacherRecord {
  teacher_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export interface ClassEntity {
  class_id: number;
  class_name: string;
  section: string;
  grade: string;
}

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceRecord {
  attendance_id: number;
  student_id: number;
  class_id: number;
  status: AttendanceStatus;
  date: string;
}

export interface SubjectRecord {
  subject_id: number;
  subject_name: string;
  subject_code?: string;
  teacher_id?: number;
  class_id?: number;
  description?: string;
  color?: string;
  teacher_name?: string;
  class_name?: string;
  section?: string;
  grade?: string;
}

export interface ChapterRecord {
  chapter_id: number;
  subject_id: number;
  chapter_number: number;
  chapter_title: string;
  description?: string;
  subject_name?: string;
}

export interface NoteRecord {
  note_id: number;
  chapter_id: number;
  title: string;
  content?: string;
  file_url?: string;
  created_by?: number;
  created_at: string;
  chapter_title?: string;
  subject_name?: string;
  teacher_name?: string;
}

export interface VideoRecord {
  video_id: number;
  chapter_id: number;
  title: string;
  video_url: string;
  description?: string;
  duration_minutes?: number;
  created_by?: number;
  created_at: string;
  chapter_title?: string;
  subject_name?: string;
  teacher_name?: string;
}

export interface LectureRecord {
  lecture_id: number;
  subject_id: number;
  teacher_id: number;
  chapter_id?: number;
  lecture_date: string;
  title: string;
  topics_covered?: string;
  description?: string;
  subject_name?: string;
  chapter_title?: string;
  teacher_name?: string;
}

export interface MCQTest {
  test_id: number;
  subject_id: number;
  chapter_id?: number;
  teacher_id: number;
  title: string;
  week_number: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  subject_name?: string;
  chapter_title?: string;
  teacher_name?: string;
  question_count?: number;
  questions?: MCQQuestion[];
}

export interface MCQQuestion {
  question_id: number;
  test_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
}

export interface TestResult {
  result_id: number;
  test_id: number;
  student_id: number;
  score: number;
  total_marks: number;
  answers: Record<string, string>;
  submitted_at: string;
  test_title?: string;
  subject_name?: string;
  student_name?: string;
}

export interface StudentPerformance {
  attendance: {
    total: string;
    present: string;
    absent: string;
    late: string;
  };
  tests: TestResult[];
  totalLectures: number;
  avgScore: number;
}

export interface TeacherPerformance {
  totalLectures: number;
  tests: Array<{
    test_id: number;
    title: string;
    subject_name: string;
    submissions: string;
    avg_score: string;
    created_at: string;
  }>;
  totalStudents: number;
  attendance: { total: string; present: string };
}

export interface ClassPerformanceRow {
  student_id: number;
  student_name: string;
  total_days: string;
  present_days: string;
  tests_taken: string;
  avg_score: string;
}
