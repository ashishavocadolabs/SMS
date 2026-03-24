import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { chapter_id, subject_id } = req.query;
  let query = `SELECT v.*, ch.chapter_title, s.subject_name,
               t.first_name || ' ' || t.last_name AS teacher_name
               FROM videos v
               LEFT JOIN chapters ch ON v.chapter_id = ch.chapter_id
               LEFT JOIN subjects s ON ch.subject_id = s.subject_id
               LEFT JOIN teachers t ON v.created_by = t.teacher_id`;
  const params: unknown[] = [];
  if (chapter_id) {
    query += ` WHERE v.chapter_id = $1`;
    params.push(chapter_id);
  } else if (subject_id) {
    query += ` WHERE s.subject_id = $1`;
    params.push(subject_id);
  }
  query += ` ORDER BY v.created_at DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.post("/", async (req: Request, res: Response) => {
  const { chapter_id, title, video_url, description, duration_minutes, created_by } = req.body;
  const result = await pool.query(
    `INSERT INTO videos (chapter_id, title, video_url, description, duration_minutes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [chapter_id, title, video_url, description, duration_minutes || 0, created_by || null]
  );

  // Notify all approved students about new video
  const chapterRow = chapter_id ? await pool.query(`SELECT ch.chapter_title, s.subject_name FROM chapters ch LEFT JOIN subjects s ON ch.subject_id=s.subject_id WHERE ch.chapter_id=$1`, [chapter_id]) : null;
  const chTitle = chapterRow?.rows[0]?.chapter_title || '';
  const subName = chapterRow?.rows[0]?.subject_name || 'a subject';
  const students = await pool.query(`SELECT student_id FROM students WHERE status='approved'`);
  for (const s of students.rows) {
    await pool.query(
      `INSERT INTO notifications(recipient_role, recipient_id, type, title, message)
       VALUES('student', $1, 'new_video', $2, $3)`,
      [s.student_id, 'New Video Uploaded', `New video "${title}" added${chTitle ? ` in ${chTitle}` : ''} for ${subName}.`]
    ).catch(() => {});
  }

  res.json(result.rows[0]);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { title, video_url, description, duration_minutes } = req.body;
  const result = await pool.query(
    `UPDATE videos SET title=$1, video_url=$2, description=$3, duration_minutes=$4
     WHERE video_id=$5 RETURNING *`,
    [title, video_url, description, duration_minutes, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM videos WHERE video_id=$1", [req.params.id]);
  res.json({ success: true });
});

export default router;
