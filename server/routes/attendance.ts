import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

/* Mark attendance (single student) */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { student_id, class_id, status, date } = req.body;
  await pool.query(
    `INSERT INTO attendance(student_id, class_id, status, date) VALUES($1,$2,$3,$4)
     ON CONFLICT(student_id, class_id, date) DO UPDATE SET status = EXCLUDED.status`,
    [student_id, class_id, status, date]
  );
  res.json({ success: true });
});

/* Bulk mark attendance (teacher marks whole class at once) */
router.post("/bulk", async (req: Request, res: Response): Promise<void> => {
  const { records, date, class_id } = req.body as {
    records: Array<{ student_id: number; status: string }>;
    date: string;
    class_id: number;
  };

  // Delete existing records for this class+date then insert fresh
  await pool.query(`DELETE FROM attendance WHERE class_id=$1 AND date=$2`, [class_id, date]);

  for (const r of records) {
    await pool.query(
      `INSERT INTO attendance(student_id, class_id, status, date) VALUES($1,$2,$3,$4)`,
      [r.student_id, class_id, r.status, date]
    );
  }

  // Notify each student about their attendance
  const classRow = await pool.query(`SELECT class_name, section FROM classes WHERE class_id=$1`, [class_id]);
  const className = classRow.rows[0] ? `${classRow.rows[0].class_name} ${classRow.rows[0].section}` : 'your class';
  for (const r of records) {
    const statusLabel = r.status.charAt(0).toUpperCase() + r.status.slice(1);
    await pool.query(
      `INSERT INTO notifications(recipient_role, recipient_id, type, title, message)
       VALUES('student', $1, 'attendance_marked', $2, $3)`,
      [r.student_id, 'Attendance Marked', `Your attendance for ${date} in ${className} has been marked as ${statusLabel}.`]
    ).catch(() => {});
  }

  res.json({ success: true, count: records.length });
});

/* Get attendance for a student (with optional date range) */
router.get("/student/:studentId", async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;
  const { from, to } = req.query;

  let query = `
    SELECT a.*, c.class_name, c.section, c.grade
    FROM attendance a
    LEFT JOIN classes c ON a.class_id = c.class_id
    WHERE a.student_id = $1
  `;
  const params: (string | number)[] = [Number(studentId)];

  if (from) {
    params.push(String(from));
    query += ` AND a.date >= $${params.length}`;
  }
  if (to) {
    params.push(String(to));
    query += ` AND a.date <= $${params.length}`;
  }

  query += ` ORDER BY a.date DESC`;

  const result = await pool.query(query, params);

  // Also compute summary
  const summary = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER(WHERE status='present')::int AS present,
       COUNT(*) FILTER(WHERE status='absent')::int AS absent,
       COUNT(*) FILTER(WHERE status='late')::int AS late
     FROM attendance WHERE student_id=$1`,
    [Number(studentId)]
  );

  res.json({
    records: result.rows,
    summary: summary.rows[0]
  });
});

/* Get attendance for a class on a specific date (teacher view) */
router.get("/class/:classId", async (req: Request, res: Response): Promise<void> => {
  const { classId } = req.params;
  const { date } = req.query;

  const result = await pool.query(
    `SELECT a.*, s.first_name, s.last_name, s.email
     FROM attendance a
     JOIN students s ON a.student_id = s.student_id
     WHERE a.class_id = $1 AND a.date = $2
     ORDER BY s.first_name, s.last_name`,
    [Number(classId), date || new Date().toISOString().slice(0, 10)]
  );

  res.json(result.rows);
});

/* Get students in a class (for teacher to mark attendance) */
router.get("/class/:classId/students", async (req: Request, res: Response): Promise<void> => {
  const { classId } = req.params;

  const result = await pool.query(
    `SELECT s.student_id, s.first_name, s.last_name, s.email
     FROM students s
     JOIN student_class_assignments sca ON s.student_id = sca.student_id
     WHERE sca.class_id = $1 AND sca.status = 'active' AND s.status = 'approved'
     ORDER BY s.first_name, s.last_name`,
    [Number(classId)]
  );

  res.json(result.rows);
});

export default router;