-- Remove any existing duplicates (keep the latest by attendance_id)
DELETE FROM attendance a
USING attendance b
WHERE a.attendance_id < b.attendance_id
  AND a.student_id = b.student_id
  AND a.class_id = b.class_id
  AND a.date = b.date;

-- Add unique constraint so ON CONFLICT works properly for CV attendance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uniq_attendance_student_class_date') THEN
    ALTER TABLE attendance ADD CONSTRAINT uniq_attendance_student_class_date UNIQUE(student_id, class_id, date);
  END IF;
END $$;
