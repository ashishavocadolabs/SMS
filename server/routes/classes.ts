import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (req, res) => {
  const { teacher_id } = req.query;
  let query = `SELECT c.*, t.first_name || ' ' || t.last_name AS teacher_name
               FROM classes c LEFT JOIN teachers t ON c.class_teacher_id = t.teacher_id`;
  const params: any[] = [];
  if (teacher_id) {
    query += ` WHERE c.class_teacher_id = $1`;
    params.push(teacher_id);
  }
  query += ` ORDER BY c.class_id`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.post("/", async (req, res) => {
  const { class_name, section, grade, class_teacher_id } = req.body;
  const result = await pool.query(
    `INSERT INTO classes(class_name, section, grade, class_teacher_id)
     VALUES($1, $2, $3, $4) RETURNING *`,
    [class_name, section, grade, class_teacher_id || null]
  );
  res.json(result.rows[0]);
});

export default router;