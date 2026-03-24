CREATE TABLE IF NOT EXISTS subjects (
  subject_id SERIAL PRIMARY KEY,
  subject_name VARCHAR(150) NOT NULL,
  subject_code VARCHAR(30),
  teacher_id INT REFERENCES teachers(teacher_id),
  class_id INT REFERENCES classes(class_id),
  description TEXT,
  color VARCHAR(20) DEFAULT '#3b82f6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
