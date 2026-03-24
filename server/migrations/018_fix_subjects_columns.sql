-- Fix subject table: ensure subject_name column exists
DO $$
BEGIN
  -- If old 'name' column exists but 'subject_name' does not, rename it
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='name')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='subject_name')
  THEN
    ALTER TABLE subjects RENAME COLUMN name TO subject_name;
    ALTER TABLE subjects ALTER COLUMN subject_name TYPE VARCHAR(150);
  END IF;

  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='subject_code') THEN
    ALTER TABLE subjects ADD COLUMN subject_code VARCHAR(30);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='description') THEN
    ALTER TABLE subjects ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='color') THEN
    ALTER TABLE subjects ADD COLUMN color VARCHAR(20) DEFAULT '#3b82f6';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='created_at') THEN
    ALTER TABLE subjects ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END$$;
