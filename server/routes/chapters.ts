import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { subject_id } = req.query;
  let query = `SELECT ch.*, s.subject_name FROM chapters ch
               LEFT JOIN subjects s ON ch.subject_id = s.subject_id`;
  const params: unknown[] = [];
  if (subject_id) {
    query += ` WHERE ch.subject_id = $1`;
    params.push(subject_id);
  }
  query += ` ORDER BY ch.subject_id, ch.chapter_number`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.get("/:id", async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT ch.*, s.subject_name FROM chapters ch
     LEFT JOIN subjects s ON ch.subject_id = s.subject_id
     WHERE ch.chapter_id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Chapter not found" });
    return;
  }
  res.json(result.rows[0]);
});

router.post("/", async (req: Request, res: Response) => {
  const { subject_id, chapter_number, chapter_title, description } = req.body;
  const result = await pool.query(
    `INSERT INTO chapters (subject_id, chapter_number, chapter_title, description)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [subject_id, chapter_number, chapter_title, description]
  );
  res.json(result.rows[0]);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { chapter_number, chapter_title, description } = req.body;
  const result = await pool.query(
    `UPDATE chapters SET chapter_number=$1, chapter_title=$2, description=$3
     WHERE chapter_id=$4 RETURNING *`,
    [chapter_number, chapter_title, description, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM chapters WHERE chapter_id=$1", [req.params.id]);
  res.json({ success: true });
});

export default router;
