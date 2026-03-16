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
