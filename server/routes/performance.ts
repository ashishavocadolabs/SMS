import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

/* Student performance */
router.get("/student/:id", async (req: Request, res: Response) => {
  const studentId = req.params.id;

  const [attendanceRes, testRes, lecturesRes] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) AS present,
              SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) AS absent,
              SUM(CASE WHEN status='late' THEN 1 ELSE 0 END) AS late
       FROM attendance WHERE student_id=$1`,
      [studentId]
    ),
    pool.query(
      `SELECT r.score, r.total_marks, r.submitted_at, t.title as test_title,
              s.subject_name, ch.chapter_title
       FROM test_results r
       JOIN mcq_tests t ON r.test_id = t.test_id
       JOIN subjects s ON t.subject_id = s.subject_id
       LEFT JOIN chapters ch ON t.chapter_id = ch.chapter_id
       WHERE r.student_id=$1
       ORDER BY r.submitted_at DESC`,
      [studentId]
    ),
    pool.query(
      `SELECT COUNT(*) AS count FROM lectures`
    ),
  ]);

  const attendance = attendanceRes.rows[0];
  const tests = testRes.rows;
  const totalLectures = parseInt(lecturesRes.rows[0].count, 10);
  const avgScore =
    tests.length > 0
      ? Math.round(
          (tests.reduce((acc: number, t) => acc + (t.total_marks > 0 ? (t.score / t.total_marks) * 100 : 0), 0) /
            tests.length)
        )
      : 0;

  res.json({
    attendance,
    tests,
    totalLectures,
    avgScore,
  });
});

/* Teacher performance */
router.get("/teacher/:id", async (req: Request, res: Response) => {
  const teacherId = req.params.id;

  const [lecturesRes, testsRes, studentsRes, attendanceRes] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS count FROM lectures WHERE teacher_id=$1`, [teacherId]
    ),
    pool.query(
      `SELECT t.test_id, t.title, t.created_at, s.subject_name,
              COUNT(r.result_id) AS submissions,
              COALESCE(AVG(CASE WHEN r.total_marks > 0 THEN r.score::float/r.total_marks*100 END),0) AS avg_score
       FROM mcq_tests t
       LEFT JOIN subjects s ON t.subject_id = s.subject_id
       LEFT JOIN test_results r ON r.test_id = t.test_id
       WHERE t.teacher_id=$1
       GROUP BY t.test_id, t.title, t.created_at, s.subject_name
       ORDER BY t.created_at DESC`,
      [teacherId]
    ),
    pool.query(
      `SELECT COUNT(DISTINCT student_id) AS count FROM attendance`
    ),
    pool.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) AS present
       FROM attendance a
       JOIN classes c ON a.class_id = c.class_id
       JOIN subjects s ON s.class_id = c.class_id
       WHERE s.teacher_id=$1`,
      [teacherId]
    ),
  ]);

  res.json({
    totalLectures: parseInt(lecturesRes.rows[0].count, 10),
    tests: testsRes.rows,
    totalStudents: parseInt(studentsRes.rows[0].count, 10),
    attendance: attendanceRes.rows[0],
  });
});

/* Class-wise student performance for teacher */
router.get("/class-performance", async (_req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT s.student_id, s.first_name || ' ' || s.last_name AS student_name,
           COUNT(DISTINCT a.attendance_id) AS total_days,
           SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) AS present_days,
           COUNT(DISTINCT r.result_id) AS tests_taken,
           COALESCE(AVG(CASE WHEN r.total_marks > 0 THEN r.score::float/r.total_marks*100 END),0) AS avg_score
    FROM students s
    LEFT JOIN attendance a ON a.student_id = s.student_id
    LEFT JOIN test_results r ON r.student_id = s.student_id
    GROUP BY s.student_id, s.first_name, s.last_name
    ORDER BY avg_score DESC
  `);
  res.json(result.rows);
});

export default router;
