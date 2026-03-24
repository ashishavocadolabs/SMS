import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

/* ---- TESTS ---- */
router.get("/tests", async (req: Request, res: Response) => {
  const { teacher_id, subject_id } = req.query;
  let query = `SELECT t.*, s.subject_name, ch.chapter_title,
               te.first_name || ' ' || te.last_name AS teacher_name,
               (SELECT COUNT(*) FROM mcq_questions q WHERE q.test_id = t.test_id) AS question_count
               FROM mcq_tests t
               LEFT JOIN subjects s ON t.subject_id = s.subject_id
               LEFT JOIN chapters ch ON t.chapter_id = ch.chapter_id
               LEFT JOIN teachers te ON t.teacher_id = te.teacher_id`;
  const params: unknown[] = [];
  if (teacher_id) {
    query += ` WHERE t.teacher_id = $1`;
    params.push(teacher_id);
  } else if (subject_id) {
    query += ` WHERE t.subject_id = $1`;
    params.push(subject_id);
  }
  query += ` ORDER BY t.created_at DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.get("/tests/:id", async (req: Request, res: Response) => {
  const testResult = await pool.query(
    `SELECT t.*, s.subject_name, ch.chapter_title FROM mcq_tests t
     LEFT JOIN subjects s ON t.subject_id = s.subject_id
     LEFT JOIN chapters ch ON t.chapter_id = ch.chapter_id
     WHERE t.test_id = $1`,
    [req.params.id]
  );
  if (testResult.rows.length === 0) {
    res.status(404).json({ error: "Test not found" });
    return;
  }
  const questionsResult = await pool.query(
    `SELECT * FROM mcq_questions WHERE test_id = $1 ORDER BY question_id`,
    [req.params.id]
  );
  res.json({ ...testResult.rows[0], questions: questionsResult.rows });
});

router.post("/tests", async (req: Request, res: Response) => {
  const { subject_id, chapter_id, teacher_id, title, week_number, duration_minutes, is_active } = req.body;
  const result = await pool.query(
    `INSERT INTO mcq_tests (subject_id, chapter_id, teacher_id, title, week_number, duration_minutes, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [subject_id, chapter_id || null, teacher_id, title, week_number || 1, duration_minutes || 30, is_active !== false]
  );

  // Notify all approved students about new MCQ test
  const subjectRow = subject_id ? await pool.query(`SELECT subject_name FROM subjects WHERE subject_id=$1`, [subject_id]) : null;
  const subjectName = subjectRow?.rows[0]?.subject_name || 'a subject';
  const students = await pool.query(`SELECT student_id FROM students WHERE status='approved'`);
  for (const s of students.rows) {
    await pool.query(
      `INSERT INTO notifications(recipient_role, recipient_id, type, title, message)
       VALUES('student', $1, 'new_mcq_test', $2, $3)`,
      [s.student_id, 'New MCQ Test', `A new test "${title}" has been created for ${subjectName}. Duration: ${duration_minutes || 30} mins.`]
    ).catch(() => {});
  }

  res.json(result.rows[0]);
});

router.put("/tests/:id", async (req: Request, res: Response) => {
  const { title, week_number, duration_minutes, is_active, chapter_id } = req.body;
  const result = await pool.query(
    `UPDATE mcq_tests SET title=$1, week_number=$2, duration_minutes=$3, is_active=$4, chapter_id=$5
     WHERE test_id=$6 RETURNING *`,
    [title, week_number, duration_minutes, is_active, chapter_id || null, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete("/tests/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM mcq_tests WHERE test_id=$1", [req.params.id]);
  res.json({ success: true });
});

/* ---- QUESTIONS ---- */
router.post("/questions", async (req: Request, res: Response) => {
  const { test_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks } = req.body;
  const result = await pool.query(
    `INSERT INTO mcq_questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [test_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks || 1]
  );
  res.json(result.rows[0]);
});

router.delete("/questions/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM mcq_questions WHERE question_id=$1", [req.params.id]);
  res.json({ success: true });
});

/* ---- RESULTS ---- */
router.post("/results", async (req: Request, res: Response) => {
  const { test_id, student_id, answers } = req.body;

  // Calculate score
  const questionsResult = await pool.query(
    `SELECT question_id, correct_option, marks FROM mcq_questions WHERE test_id = $1`,
    [test_id]
  );
  const questions = questionsResult.rows;
  let score = 0;
  let total = 0;
  for (const q of questions) {
    total += q.marks;
    const submitted = answers[q.question_id];
    if (submitted && submitted.toUpperCase() === q.correct_option) {
      score += q.marks;
    }
  }

  const result = await pool.query(
    `INSERT INTO test_results (test_id, student_id, score, total_marks, answers)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (test_id, student_id)
     DO UPDATE SET score=$3, total_marks=$4, answers=$5, submitted_at=NOW()
     RETURNING *`,
    [test_id, student_id, score, total, JSON.stringify(answers)]
  );

  // Notify the teacher who created the test about the submission
  const testRow = await pool.query(`SELECT t.teacher_id, t.title FROM mcq_tests t WHERE t.test_id=$1`, [test_id]);
  const studentRow = await pool.query(`SELECT first_name, last_name FROM students WHERE student_id=$1`, [student_id]);
  if (testRow.rows[0]?.teacher_id) {
    const sName = studentRow.rows[0] ? `${studentRow.rows[0].first_name} ${studentRow.rows[0].last_name}` : 'A student';
    await pool.query(
      `INSERT INTO notifications(recipient_role, recipient_id, type, title, message)
       VALUES('teacher', $1, 'test_submitted', $2, $3)`,
      [testRow.rows[0].teacher_id, 'Test Submitted', `${sName} submitted "${testRow.rows[0].title}" — Score: ${score}/${total}`]
    ).catch(() => {});
  }

  res.json(result.rows[0]);
});

router.get("/results", async (req: Request, res: Response) => {
  const { test_id, student_id } = req.query;
  let query = `SELECT r.*, s.first_name || ' ' || s.last_name AS student_name,
               t.title AS test_title, sub.subject_name
               FROM test_results r
               LEFT JOIN students s ON r.student_id = s.student_id
               LEFT JOIN mcq_tests t ON r.test_id = t.test_id
               LEFT JOIN subjects sub ON t.subject_id = sub.subject_id`;
  const params: unknown[] = [];
  if (test_id) {
    query += ` WHERE r.test_id = $1`;
    params.push(test_id);
  } else if (student_id) {
    query += ` WHERE r.student_id = $1`;
    params.push(student_id);
  }
  query += ` ORDER BY r.submitted_at DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

export default router;
