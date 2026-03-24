CREATE TABLE IF NOT EXISTS notes (
  note_id SERIAL PRIMARY KEY,
  chapter_id INT REFERENCES chapters(chapter_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  file_url VARCHAR(500),
  created_by INT REFERENCES teachers(teacher_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
