CREATE TABLE IF NOT EXISTS videos (
  video_id SERIAL PRIMARY KEY,
  chapter_id INT REFERENCES chapters(chapter_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 0,
  created_by INT REFERENCES teachers(teacher_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
