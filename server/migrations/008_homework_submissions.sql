CREATE TABLE IF NOT EXISTS homework_submissions (

submission_id SERIAL PRIMARY KEY,

homework_id INT REFERENCES homework(homework_id),

student_id INT REFERENCES students(student_id),

file_url TEXT,

submission_date TIMESTAMP,

marks INT,

status VARCHAR(20)

);