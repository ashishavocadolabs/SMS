CREATE TABLE IF NOT EXISTS chapters (
  chapter_id SERIAL PRIMARY KEY,
  subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
  chapter_number INT NOT NULL DEFAULT 1,
  chapter_title VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
