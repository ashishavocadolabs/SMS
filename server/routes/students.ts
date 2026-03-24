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

/* REGISTER (POST /api/students) */
router.post("/", async (req, res): Promise<void> => {
  try {
    const { first_name, last_name, email, phone, password } = req.body;

    if (!first_name || !last_name || !email || !password) {
      res.status(400).json({ error: "All fields are required." });
      return;
    }

    // Check if email exists
    const exists = await pool.query("SELECT student_id FROM students WHERE email = $1", [email.toLowerCase()]);
    if (exists.rows.length > 0) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const password_hash = hashPassword(password);

    const result = await pool.query(
      `INSERT INTO students(first_name, last_name, email, phone, password_hash, status)
       VALUES($1, $2, $3, $4, $5, 'pending') RETURNING student_id, first_name, last_name, email, phone, status, created_at`,
      [first_name, last_name, email.toLowerCase(), phone || null, password_hash]
    );

    // Notify all teachers about new registration
    const teachers = await pool.query("SELECT teacher_id FROM teachers");
    for (const t of teachers.rows) {
      await pool.query(
        `INSERT INTO notifications(recipient_role, recipient_id, type, title, message)
         VALUES('teacher', $1, 'new_registration', 'New Student Registration',
                $2)`,
        [t.teacher_id, `${first_name} ${last_name} has registered and is pending approval.`]
      ).catch(() => {});
    }

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Student register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

/* LOGIN (POST /api/students/login) */
router.post("/login", async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const result = await pool.query(
      "SELECT * FROM students WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "No account found with this email. Please register first." });
      return;
    }

    const student = result.rows[0];

    if (!student.password_hash || !verifyPassword(password, student.password_hash)) {
      res.status(401).json({ error: "Incorrect password. Please try again." });
      return;
    }

    if (student.status === "pending") {
      res.status(403).json({ error: "Your account is pending approval. Please wait for teacher to approve." });
      return;
    }
    if (student.status === "rejected") {
      res.status(403).json({ error: "Your registration was rejected. Please contact your teacher." });
      return;
    }

    const { password_hash, ...safeStudent } = student;
    res.json(safeStudent);
  } catch (err) {
    console.error("Student login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

/* GET ALL STUDENTS (no passwords) */
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    let query = "SELECT student_id, first_name, last_name, email, phone, date_of_birth, gender, blood_group, address, status, class_id, created_at FROM students";
    const params: string[] = [];
    if (status && typeof status === "string") {
      query += " WHERE status = $1";
      params.push(status);
    }
    query += " ORDER BY student_id DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch students." });
  }
});

/* UPDATE STUDENT DETAILS (PUT /api/students/:id) */
router.put("/:id", async (req, res): Promise<void> => {
  try {
    const id = req.params.id;
    if (!/^\d+$/.test(id)) { res.status(400).json({ error: "Invalid student ID." }); return; }
    const { first_name, last_name, email, phone, date_of_birth, gender, blood_group, address } = req.body;

    // Check email uniqueness
    if (email) {
      const dup = await pool.query("SELECT student_id FROM students WHERE email = $1 AND student_id != $2", [email.toLowerCase(), id]);
      if (dup.rows.length > 0) {
        res.status(409).json({ error: "Email already in use." });
        return;
      }
    }

    const result = await pool.query(
      `UPDATE students SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
       email = COALESCE($3, email), phone = COALESCE($4, phone), date_of_birth = COALESCE($5, date_of_birth),
       gender = COALESCE($6, gender), blood_group = COALESCE($7, blood_group), address = COALESCE($8, address)
       WHERE student_id = $9
       RETURNING student_id, first_name, last_name, email, phone, date_of_birth, gender, blood_group, address, status, class_id, created_at`,
      [first_name || null, last_name || null, email?.toLowerCase() || null, phone || null, date_of_birth || null, gender || null, blood_group || null, address || null, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Student not found." });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update student error:", err);
    res.status(500).json({ error: "Failed to update student." });
  }
});

/* APPROVE / REJECT student (PUT /api/students/:id/approve) */
router.put("/:id/approve", async (req, res): Promise<void> => {
  try {
    const { status, class_id } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: "Status must be 'approved' or 'rejected'." });
      return;
    }
    const result = await pool.query(
      `UPDATE students SET status = $1, class_id = $2 WHERE student_id = $3
       RETURNING student_id, first_name, last_name, email, phone, status, class_id`,
      [status, class_id || null, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Student not found." });
      return;
    }
    // Also add to student_class_assignments if approved with class
    if (status === 'approved' && class_id) {
      await pool.query(
        `INSERT INTO student_class_assignments(student_id, class_id, status, academic_year)
         VALUES($1, $2, 'active', '2025-2026')
         ON CONFLICT DO NOTHING`,
        [req.params.id, class_id]
      );
    }

    // Create notification for the student
    const notifTitle = status === 'approved' ? 'Registration Approved' : 'Registration Rejected';
    const notifMsg = status === 'approved'
      ? 'Your registration has been approved. You can now log in and access your dashboard.'
      : 'Your registration has been rejected. Please contact your teacher for details.';
    await pool.query(
      `INSERT INTO notifications(recipient_role, recipient_id, type, title, message)
       VALUES('student', $1, $2, $3, $4)`,
      [req.params.id, `student_${status}`, notifTitle, notifMsg]
    ).catch(() => {});

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Approve student error:", err);
    res.status(500).json({ error: "Failed to update student status." });
  }
});

/* UPDATE PROFILE (PUT /api/students/:id/settings) */
router.put("/:id/settings", async (req, res): Promise<void> => {
  try {
    const { email, phone, current_password, new_password } = req.body;
    const studentId = req.params.id;

    const existing = await pool.query("SELECT * FROM students WHERE student_id = $1", [studentId]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: "Student not found." });
      return;
    }

    const student = existing.rows[0];

    // If changing password, verify current password
    if (new_password) {
      if (!current_password) {
        res.status(400).json({ error: "Current password is required to change password." });
        return;
      }
      if (!verifyPassword(current_password, student.password_hash)) {
        res.status(401).json({ error: "Current password is incorrect." });
        return;
      }
      if (new_password.length < 6) {
        res.status(400).json({ error: "New password must be at least 6 characters." });
        return;
      }
    }

    // check email uniqueness if changed
    if (email && email.toLowerCase() !== student.email) {
      const dup = await pool.query("SELECT student_id FROM students WHERE email = $1 AND student_id != $2", [email.toLowerCase(), studentId]);
      if (dup.rows.length > 0) {
        res.status(409).json({ error: "This email is already in use." });
        return;
      }
    }

    let query: string;
    let params: any[];

    if (new_password) {
      const pw_hash = hashPassword(new_password);
      query = `UPDATE students SET email = $1, phone = $2, password_hash = $3 WHERE student_id = $4
               RETURNING student_id, first_name, last_name, email, phone`;
      params = [email?.toLowerCase() ?? student.email, phone ?? student.phone, pw_hash, studentId];
    } else {
      query = `UPDATE students SET email = $1, phone = $2 WHERE student_id = $3
               RETURNING student_id, first_name, last_name, email, phone`;
      params = [email?.toLowerCase() ?? student.email, phone ?? student.phone, studentId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Student settings error:", err);
    res.status(500).json({ error: "Failed to update settings." });
  }
});

export default router;
