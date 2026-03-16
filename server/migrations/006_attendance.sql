CREATE TABLE IF NOT EXISTS attendance (

attendance_id SERIAL PRIMARY KEY,

student_id INT REFERENCES students(student_id),

class_id INT REFERENCES classes(class_id),

status VARCHAR(20),

date DATE

);