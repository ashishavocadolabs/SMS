CREATE TABLE IF NOT EXISTS mcq_tests (
  test_id SERIAL PRIMARY KEY,
  subject_id INT REFERENCES subjects(subject_id),
  chapter_id INT REFERENCES chapters(chapter_id),
  teacher_id INT REFERENCES teachers(teacher_id),
  title VARCHAR(200) NOT NULL,
  week_number INT DEFAULT 1,
  duration_minutes INT DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mcq_questions (
  question_id SERIAL PRIMARY KEY,
  test_id INT REFERENCES mcq_tests(test_id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a VARCHAR(500),
  option_b VARCHAR(500),
  option_c VARCHAR(500),
  option_d VARCHAR(500),
  correct_option CHAR(1) CHECK (correct_option IN ('A','B','C','D')),
  marks INT DEFAULT 1
);
