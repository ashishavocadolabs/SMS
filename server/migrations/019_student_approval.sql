-- Add approval status to students (pending until teacher approves)
ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE students ADD COLUMN IF NOT EXISTS class_id INT REFERENCES classes(class_id);

-- Approve any existing students so they aren't locked out
UPDATE students SET status = 'approved' WHERE status IS NULL OR status = 'pending';
