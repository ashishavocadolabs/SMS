import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { chapter_id, subject_id } = req.query;
  let query = `SELECT n.*, ch.chapter_title, s.subject_name,
               t.first_name || ' ' || t.last_name AS teacher_name
               FROM notes n
               LEFT JOIN chapters ch ON n.chapter_id = ch.chapter_id
               LEFT JOIN subjects s ON ch.subject_id = s.subject_id
               LEFT JOIN teachers t ON n.created_by = t.teacher_id`;
  const params: unknown[] = [];
  if (chapter_id) {
    query += ` WHERE n.chapter_id = $1`;
    params.push(chapter_id);
  } else if (subject_id) {
    query += ` WHERE s.subject_id = $1`;
    params.push(subject_id);
  }
  query += ` ORDER BY n.created_at DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.post("/", async (req: Request, res: Response) => {
  const { chapter_id, title, content, file_url, created_by } = req.body;
  const result = await pool.query(
    `INSERT INTO notes (chapter_id, title, content, file_url, created_by)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [chapter_id, title, content, file_url || null, created_by || null]
  );

  // Notify all approved students about new notes
  const chapterRow = chapter_id ? await pool.query(`SELECT ch.chapter_title, s.subject_name FROM chapters ch LEFT JOIN subjects s ON ch.subject_id=s.subject_id WHERE ch.chapter_id=$1`, [chapter_id]) : null;
  const chTitle = chapterRow?.rows[0]?.chapter_title || '';
  const subName = chapterRow?.rows[0]?.subject_name || 'a subject';
  const students = await pool.query(`SELECT student_id FROM students WHERE status='approved'`);
  for (const s of students.rows) {
    await pool.query(
      `INSERT INTO notifications(recipient_role, recipient_id, type, title, message)
       VALUES('student', $1, 'new_note', $2, $3)`,
      [s.student_id, 'New Notes Uploaded', `New notes "${title}" added${chTitle ? ` in ${chTitle}` : ''} for ${subName}.`]
    ).catch(() => {});
  }

  res.json(result.rows[0]);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { title, content, file_url } = req.body;
  const result = await pool.query(
    `UPDATE notes SET title=$1, content=$2, file_url=$3 WHERE note_id=$4 RETURNING *`,
    [title, content, file_url || null, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM notes WHERE note_id=$1", [req.params.id]);
  res.json({ success: true });
});

export default router;
