import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT s.*, t.first_name || ' ' || t.last_name AS teacher_name,
           c.class_name, c.section, c.grade
    FROM subjects s
    LEFT JOIN teachers t ON s.teacher_id = t.teacher_id
    LEFT JOIN classes c ON s.class_id = c.class_id
    ORDER BY s.subject_id
  `);
  res.json(result.rows);
});

router.get("/:id", async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT s.*, t.first_name || ' ' || t.last_name AS teacher_name
     FROM subjects s
     LEFT JOIN teachers t ON s.teacher_id = t.teacher_id
     WHERE s.subject_id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json(result.rows[0]);
});

router.post("/", async (req: Request, res: Response) => {
  const { subject_name, subject_code, teacher_id, class_id, description, color } = req.body;
  const result = await pool.query(
    `INSERT INTO subjects (subject_name, subject_code, teacher_id, class_id, description, color)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [subject_name, subject_code, teacher_id || null, class_id || null, description, color || "#3b82f6"]
  );
  res.json(result.rows[0]);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { subject_name, subject_code, teacher_id, class_id, description, color } = req.body;
  const result = await pool.query(
    `UPDATE subjects SET subject_name=$1, subject_code=$2, teacher_id=$3, class_id=$4,
     description=$5, color=$6 WHERE subject_id=$7 RETURNING *`,
    [subject_name, subject_code, teacher_id || null, class_id || null, description, color, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM subjects WHERE subject_id=$1", [req.params.id]);
  res.json({ success: true });
});

export default router;
