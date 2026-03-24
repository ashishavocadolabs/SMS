CREATE TABLE IF NOT EXISTS test_results (
  result_id SERIAL PRIMARY KEY,
  test_id INT REFERENCES mcq_tests(test_id),
  student_id INT REFERENCES students(student_id),
  score INT DEFAULT 0,
  total_marks INT DEFAULT 0,
  answers JSONB,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(test_id, student_id)
);
