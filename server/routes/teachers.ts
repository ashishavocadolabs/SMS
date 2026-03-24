import { Router } from "express";
import { pool } from "../db";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashVerify = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(hashVerify, "hex"));
}

/* REGISTER (POST /api/teachers) */
router.post("/", async (req, res): Promise<void> => {
  try {
    const { first_name, last_name, email, phone, specialization, password } = req.body;

    if (!first_name || !last_name || !email || !password) {
      res.status(400).json({ error: "All fields are required." });
      return;
    }

    const exists = await pool.query("SELECT teacher_id FROM teachers WHERE email = $1", [email.toLowerCase()]);
    if (exists.rows.length > 0) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const password_hash = hashPassword(password);

    const result = await pool.query(
      `INSERT INTO teachers(first_name, last_name, email, phone, specialization, password_hash)
       VALUES($1, $2, $3, $4, $5, $6) RETURNING teacher_id, first_name, last_name, email, phone, specialization, created_at`,
      [first_name, last_name, email.toLowerCase(), phone || null, specialization || null, password_hash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Teacher register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

/* LOGIN (POST /api/teachers/login) */
router.post("/login", async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const result = await pool.query(
      "SELECT * FROM teachers WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "No account found with this email. Please register first." });
      return;
    }

    const teacher = result.rows[0];

    if (!teacher.password_hash || !verifyPassword(password, teacher.password_hash)) {
      res.status(401).json({ error: "Incorrect password. Please try again." });
      return;
    }

    const { password_hash, ...safeTeacher } = teacher;
    res.json(safeTeacher);
  } catch (err) {
    console.error("Teacher login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

/* GET ALL TEACHERS (no passwords) */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT teacher_id, first_name, last_name, email, phone, specialization, created_at FROM teachers ORDER BY teacher_id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teachers." });
  }
});

/* UPDATE PROFILE (PUT /api/teachers/:id/settings) */
router.put("/:id/settings", async (req, res): Promise<void> => {
  try {
    const { email, phone, current_password, new_password } = req.body;
    const teacherId = req.params.id;

    const existing = await pool.query("SELECT * FROM teachers WHERE teacher_id = $1", [teacherId]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: "Teacher not found." });
      return;
    }

    const teacher = existing.rows[0];

    if (new_password) {
      if (!current_password) {
        res.status(400).json({ error: "Current password is required to change password." });
        return;
      }
      if (!verifyPassword(current_password, teacher.password_hash)) {
        res.status(401).json({ error: "Current password is incorrect." });
        return;
      }
      if (new_password.length < 6) {
        res.status(400).json({ error: "New password must be at least 6 characters." });
        return;
      }
    }

    if (email && email.toLowerCase() !== teacher.email) {
      const dup = await pool.query("SELECT teacher_id FROM teachers WHERE email = $1 AND teacher_id != $2", [email.toLowerCase(), teacherId]);
      if (dup.rows.length > 0) {
        res.status(409).json({ error: "This email is already in use." });
        return;
      }
    }

    let query: string;
    let params: any[];

    if (new_password) {
      const pw_hash = hashPassword(new_password);
      query = `UPDATE teachers SET email = $1, phone = $2, password_hash = $3 WHERE teacher_id = $4
               RETURNING teacher_id, first_name, last_name, email, phone`;
      params = [email?.toLowerCase() ?? teacher.email, phone ?? teacher.phone, pw_hash, teacherId];
    } else {
      query = `UPDATE teachers SET email = $1, phone = $2 WHERE teacher_id = $3
               RETURNING teacher_id, first_name, last_name, email, phone`;
      params = [email?.toLowerCase() ?? teacher.email, phone ?? teacher.phone, teacherId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Teacher settings error:", err);
    res.status(500).json({ error: "Failed to update settings." });
  }
});

export default router;
