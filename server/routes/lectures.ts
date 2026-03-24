import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { teacher_id, subject_id } = req.query;
  let query = `SELECT l.*, s.subject_name, ch.chapter_title,
               t.first_name || ' ' || t.last_name AS teacher_name
               FROM lectures l
               LEFT JOIN subjects s ON l.subject_id = s.subject_id
               LEFT JOIN chapters ch ON l.chapter_id = ch.chapter_id
               LEFT JOIN teachers t ON l.teacher_id = t.teacher_id`;
  const params: unknown[] = [];
  if (teacher_id) {
    query += ` WHERE l.teacher_id = $1`;
    params.push(teacher_id);
  } else if (subject_id) {
    query += ` WHERE l.subject_id = $1`;
    params.push(subject_id);
  }
  query += ` ORDER BY l.lecture_date DESC, l.lecture_id DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.post("/", async (req: Request, res: Response) => {
  const { subject_id, teacher_id, chapter_id, lecture_date, title, topics_covered, description } = req.body;
  const result = await pool.query(
    `INSERT INTO lectures (subject_id, teacher_id, chapter_id, lecture_date, title, topics_covered, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [subject_id, teacher_id, chapter_id || null, lecture_date, title, topics_covered, description]
  );

  // Notify all approved students about new lecture
  const subjectRow = subject_id ? await pool.query(`SELECT subject_name FROM subjects WHERE subject_id=$1`, [subject_id]) : null;
  const subjectName = subjectRow?.rows[0]?.subject_name || 'a subject';
  const students = await pool.query(`SELECT student_id FROM students WHERE status='approved'`);
  for (const s of students.rows) {
    await pool.query(
      `INSERT INTO notifications(recipient_role, recipient_id, type, title, message)
       VALUES('student', $1, 'new_lecture', $2, $3)`,
      [s.student_id, 'New Lecture', `A new lecture "${title}" has been scheduled for ${subjectName} on ${lecture_date || 'TBD'}.`]
    ).catch(() => {});
  }

  res.json(result.rows[0]);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { title, topics_covered, description, lecture_date, chapter_id } = req.body;
  const result = await pool.query(
    `UPDATE lectures SET title=$1, topics_covered=$2, description=$3,
     lecture_date=$4, chapter_id=$5 WHERE lecture_id=$6 RETURNING *`,
    [title, topics_covered, description, lecture_date, chapter_id || null, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM lectures WHERE lecture_id=$1", [req.params.id]);
  res.json({ success: true });
});

export default router;
