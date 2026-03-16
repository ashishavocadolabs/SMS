CREATE TABLE IF NOT EXISTS students (

student_id SERIAL PRIMARY KEY,

first_name VARCHAR(100),
last_name VARCHAR(100),

email VARCHAR(150) UNIQUE,
phone VARCHAR(20),

date_of_birth DATE,
gender VARCHAR(10),

blood_group VARCHAR(5),

address TEXT,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);