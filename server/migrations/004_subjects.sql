CREATE TABLE IF NOT EXISTS subjects (

subject_id SERIAL PRIMARY KEY,

name VARCHAR(100),

class_id INT REFERENCES classes(class_id),

teacher_id INT REFERENCES teachers(teacher_id)

);