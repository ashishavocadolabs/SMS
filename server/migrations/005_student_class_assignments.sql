CREATE TABLE IF NOT EXISTS student_class_assignments (

id SERIAL PRIMARY KEY,

student_id INT REFERENCES students(student_id),

class_id INT REFERENCES classes(class_id),

roll_number INT,

academic_year VARCHAR(10),

status VARCHAR(20) DEFAULT 'active'

);