CREATE TABLE IF NOT EXISTS lectures (
  lecture_id SERIAL PRIMARY KEY,
  subject_id INT REFERENCES subjects(subject_id),
  teacher_id INT REFERENCES teachers(teacher_id),
  chapter_id INT REFERENCES chapters(chapter_id),
  lecture_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title VARCHAR(200) NOT NULL,
  topics_covered TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
