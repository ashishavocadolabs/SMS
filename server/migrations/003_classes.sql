CREATE TABLE IF NOT EXISTS classes (

class_id SERIAL PRIMARY KEY,

class_name VARCHAR(50),
section VARCHAR(10),
grade VARCHAR(20),

room_number VARCHAR(20),

class_teacher_id INT REFERENCES teachers(teacher_id)

);