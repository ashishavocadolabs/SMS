CREATE TABLE IF NOT EXISTS homework (

homework_id SERIAL PRIMARY KEY,

class_id INT REFERENCES classes(class_id),

subject_id INT REFERENCES subjects(subject_id),

title TEXT,

description TEXT,

due_date DATE,

teacher_id INT REFERENCES teachers(teacher_id),

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);