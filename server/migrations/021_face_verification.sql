-- Face verification columns on students
ALTER TABLE students ADD COLUMN IF NOT EXISTS face_descriptor JSONB;
ALTER TABLE students ADD COLUMN IF NOT EXISTS face_registered BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS face_photo TEXT;

-- Face verification columns on teachers
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS face_descriptor JSONB;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS face_registered BOOLEAN DEFAULT FALSE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS face_photo TEXT;

-- CV (Camera Verification) attendance sessions
CREATE TABLE IF NOT EXISTS cv_attendance_sessions (
  session_id SERIAL PRIMARY KEY,
  class_id INT REFERENCES classes(class_id) ON DELETE CASCADE,
  teacher_id INT REFERENCES teachers(teacher_id),
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  auto_activate BOOLEAN DEFAULT FALSE,
  allow_late_minutes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CV attendance verification log
CREATE TABLE IF NOT EXISTS cv_attendance_log (
  log_id SERIAL PRIMARY KEY,
  session_id INT REFERENCES cv_attendance_sessions(session_id) ON DELETE CASCADE,
  student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
  verified_at TIMESTAMP DEFAULT NOW(),
  confidence REAL NOT NULL,
  method VARCHAR(20) DEFAULT 'self',
  status VARCHAR(20) DEFAULT 'verified'
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cv_log_unique ON cv_attendance_log(session_id, student_id);
