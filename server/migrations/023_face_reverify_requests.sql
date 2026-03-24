CREATE TABLE IF NOT EXISTS face_reverify_requests (
  request_id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(student_id),
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by INT REFERENCES teachers(teacher_id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
