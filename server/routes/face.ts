import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

/* ─── Euclidean distance between two face descriptors ─── */
function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

const MATCH_THRESHOLD = 0.6; // industry standard for face-api.js

/* ─── Helper: get local date and time (avoids UTC mismatch) ─── */
function localNow() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return { date: `${y}-${m}-${d}`, time: `${hh}:${mm}:${ss}` };
}

/* ─── REGISTER FACE (student or teacher) ─── */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { role, user_id, descriptor, photo } = req.body;
  if (!role || !user_id || !descriptor || !Array.isArray(descriptor)) {
    res.status(400).json({ error: "role, user_id, and descriptor (array) are required." });
    return;
  }

  const table = role === "teacher" ? "teachers" : "students";
  const idCol = role === "teacher" ? "teacher_id" : "student_id";

  // Students cannot re-register once face is verified (locked)
  if (role === "student") {
    const existing = await pool.query(
      `SELECT face_registered FROM ${table} WHERE ${idCol} = $1`,
      [user_id]
    );
    if (existing.rows[0]?.face_registered) {
      res.status(403).json({ error: "Face already registered and locked. You cannot change your registered face." });
      return;
    }
  }

  await pool.query(
    `UPDATE ${table} SET face_descriptor = $1, face_registered = TRUE, face_photo = $2 WHERE ${idCol} = $3`,
    [JSON.stringify(descriptor), photo || null, user_id]
  );

  res.json({ success: true, message: "Face registered successfully." });
});

/* ─── CHECK FACE STATUS ─── */
router.get("/status", async (req: Request, res: Response): Promise<void> => {
  const { role, user_id } = req.query;
  if (!role || !user_id) {
    res.status(400).json({ error: "role and user_id required." });
    return;
  }

  const table = role === "teacher" ? "teachers" : "students";
  const idCol = role === "teacher" ? "teacher_id" : "student_id";

  const result = await pool.query(
    `SELECT face_registered, face_photo FROM ${table} WHERE ${idCol} = $1`,
    [user_id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  res.json({
    face_registered: result.rows[0].face_registered || false,
    face_photo: result.rows[0].face_photo || null,
  });
});

/* ─── GET STORED DESCRIPTOR (for client-side matching) ─── */
router.get("/descriptor", async (req: Request, res: Response): Promise<void> => {
  const { role, user_id } = req.query;
  if (!role || !user_id) {
    res.status(400).json({ error: "role and user_id required." });
    return;
  }

  const table = role === "teacher" ? "teachers" : "students";
  const idCol = role === "teacher" ? "teacher_id" : "student_id";

  const result = await pool.query(
    `SELECT face_descriptor FROM ${table} WHERE ${idCol} = $1`,
    [user_id]
  );

  if (result.rows.length === 0 || !result.rows[0].face_descriptor) {
    res.status(404).json({ error: "Face not registered." });
    return;
  }

  res.json({ descriptor: result.rows[0].face_descriptor });
});

/* ─── SERVER-SIDE VERIFY (compare submitted vs stored) ─── */
router.post("/verify", async (req: Request, res: Response): Promise<void> => {
  const { role, user_id, descriptor } = req.body;
  if (!role || !user_id || !descriptor) {
    res.status(400).json({ error: "role, user_id, descriptor required." });
    return;
  }

  const table = role === "teacher" ? "teachers" : "students";
  const idCol = role === "teacher" ? "teacher_id" : "student_id";

  const result = await pool.query(
    `SELECT face_descriptor FROM ${table} WHERE ${idCol} = $1`,
    [user_id]
  );

  if (result.rows.length === 0 || !result.rows[0].face_descriptor) {
    res.status(400).json({ error: "Face not registered. Please register your face first." });
    return;
  }

  const stored = result.rows[0].face_descriptor;
  const distance = euclidean(stored, descriptor);
  const confidence = Math.max(0, Math.min(1, 1 - distance));
  const matched = distance < MATCH_THRESHOLD;

  res.json({ matched, confidence: parseFloat(confidence.toFixed(4)), distance: parseFloat(distance.toFixed(4)) });
});

/* ─── CV ATTENDANCE SESSIONS (teacher CRUD) ─── */

// List sessions
router.get("/cv-sessions", async (req: Request, res: Response): Promise<void> => {
  const { teacher_id, class_id } = req.query;
  let query = `SELECT s.*, c.class_name, c.section, c.grade,
               t.first_name || ' ' || t.last_name AS teacher_name,
               (SELECT COUNT(*) FROM cv_attendance_log l WHERE l.session_id = s.session_id)::int AS verified_count
               FROM cv_attendance_sessions s
               LEFT JOIN classes c ON s.class_id = c.class_id
               LEFT JOIN teachers t ON s.teacher_id = t.teacher_id`;
  const params: unknown[] = [];
  if (teacher_id) {
    query += ` WHERE s.teacher_id = $1`;
    params.push(teacher_id);
  } else if (class_id) {
    query += ` WHERE s.class_id = $1`;
    params.push(class_id);
  }
  query += ` ORDER BY s.session_date DESC, s.start_time DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// Create session
router.post("/cv-sessions", async (req: Request, res: Response): Promise<void> => {
  const { class_id, teacher_id, session_date, start_time, end_time, auto_activate, allow_late_minutes } = req.body;
  if (!class_id || !teacher_id || !session_date || !start_time || !end_time) {
    res.status(400).json({ error: "class_id, teacher_id, session_date, start_time, end_time required." });
    return;
  }

  const result = await pool.query(
    `INSERT INTO cv_attendance_sessions(class_id, teacher_id, session_date, start_time, end_time, auto_activate, allow_late_minutes)
     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [class_id, teacher_id, session_date, start_time, end_time, auto_activate || false, allow_late_minutes || 0]
  );

  // Notify students in that class
  const students = await pool.query(
    `SELECT s.student_id FROM students s
     JOIN student_class_assignments sca ON s.student_id = sca.student_id
     WHERE sca.class_id = $1 AND sca.status = 'active' AND s.status = 'approved'`,
    [class_id]
  );
  const classRow = await pool.query(`SELECT class_name, section FROM classes WHERE class_id=$1`, [class_id]);
  const cn = classRow.rows[0] ? `${classRow.rows[0].class_name} ${classRow.rows[0].section}` : 'your class';
  for (const st of students.rows) {
    await pool.query(
      `INSERT INTO notifications(recipient_role, recipient_id, type, title, message)
       VALUES('student', $1, 'cv_session', $2, $3)`,
      [st.student_id, 'Face Verification Attendance',
       `A face verification session is scheduled for ${cn} on ${session_date} from ${start_time} to ${end_time}. Please verify your face on time.`]
    ).catch(() => {});
  }

  res.json(result.rows[0]);
});

// Activate / deactivate session
router.put("/cv-sessions/:id", async (req: Request, res: Response): Promise<void> => {
  const { is_active, start_time, end_time, auto_activate, allow_late_minutes } = req.body;
  const result = await pool.query(
    `UPDATE cv_attendance_sessions SET
       is_active = COALESCE($1, is_active),
       start_time = COALESCE($2, start_time),
       end_time = COALESCE($3, end_time),
       auto_activate = COALESCE($4, auto_activate),
       allow_late_minutes = COALESCE($5, allow_late_minutes)
     WHERE session_id = $6 RETURNING *`,
    [is_active ?? null, start_time || null, end_time || null, auto_activate ?? null, allow_late_minutes ?? null, req.params.id]
  );
  if (result.rows.length === 0) {
    res.status(404).json({ error: "Session not found." });
    return;
  }
  res.json(result.rows[0]);
});

// Delete session
router.delete("/cv-sessions/:id", async (req: Request, res: Response): Promise<void> => {
  await pool.query("DELETE FROM cv_attendance_sessions WHERE session_id=$1", [req.params.id]);
  res.json({ success: true });
});

// Get active session for a student's class
router.get("/cv-sessions/active", async (req: Request, res: Response): Promise<void> => {
  const { student_id } = req.query;
  if (!student_id) {
    res.status(400).json({ error: "student_id required." });
    return;
  }

  // Get student's class
  const classResult = await pool.query(
    `SELECT sca.class_id FROM student_class_assignments sca WHERE sca.student_id = $1 AND sca.status = 'active' LIMIT 1`,
    [student_id]
  );
  if (classResult.rows.length === 0) {
    res.json({ session: null, already_verified: false });
    return;
  }

  const classId = classResult.rows[0].class_id;
  const { date: today, time: currentTime } = localNow();

  // Find active session (is_active=true OR auto_activate=true within time window)
  const session = await pool.query(
    `SELECT s.*, c.class_name, c.section, c.grade
     FROM cv_attendance_sessions s
     LEFT JOIN classes c ON s.class_id = c.class_id
     WHERE s.class_id = $1 AND s.session_date = $2
       AND (
         s.is_active = TRUE
         OR (s.auto_activate = TRUE AND $3 >= s.start_time AND $3 <= s.end_time)
       )
     ORDER BY s.start_time
     LIMIT 1`,
    [classId, today, currentTime]
  );

  if (session.rows.length === 0) {
    res.json({ session: null, already_verified: false });
    return;
  }

  // Check if student already verified
  const verified = await pool.query(
    `SELECT log_id FROM cv_attendance_log WHERE session_id = $1 AND student_id = $2`,
    [session.rows[0].session_id, student_id]
  );

  res.json({
    session: session.rows[0],
    already_verified: verified.rows.length > 0,
  });
});

/* ─── STUDENT MARK ATTENDANCE VIA FACE VERIFY ─── */
router.post("/cv-verify-attendance", async (req: Request, res: Response): Promise<void> => {
  const { session_id, student_id, descriptor } = req.body;
  if (!session_id || !student_id || !descriptor) {
    res.status(400).json({ error: "session_id, student_id, descriptor required." });
    return;
  }

  // Check session exists and is accessible
  const sessionResult = await pool.query(
    `SELECT * FROM cv_attendance_sessions WHERE session_id = $1`,
    [session_id]
  );
  if (sessionResult.rows.length === 0) {
    res.status(404).json({ error: "Session not found." });
    return;
  }

  const session = sessionResult.rows[0];
  const { date: today, time: currentTime } = localNow();

  // Compare session date (PostgreSQL DATE may come as Date object)
  const sessionDate = typeof session.session_date === 'string'
    ? session.session_date.slice(0, 10)
    : new Date(session.session_date).toLocaleDateString('en-CA');
  if (sessionDate !== today) {
    res.status(400).json({ error: "This session is not for today." });
    return;
  }

  if (!session.is_active && !(session.auto_activate && currentTime >= session.start_time && currentTime <= session.end_time)) {
    res.status(400).json({ error: "This session is not currently active." });
    return;
  }

  // Already verified?
  const existing = await pool.query(
    `SELECT log_id FROM cv_attendance_log WHERE session_id = $1 AND student_id = $2`,
    [session_id, student_id]
  );
  if (existing.rows.length > 0) {
    res.status(400).json({ error: "You have already verified your attendance for this session." });
    return;
  }

  // Get stored descriptor
  const stuResult = await pool.query(
    `SELECT face_descriptor FROM students WHERE student_id = $1`,
    [student_id]
  );
  if (!stuResult.rows[0]?.face_descriptor) {
    res.status(400).json({ error: "Face not registered. Please register your face first." });
    return;
  }

  const stored = stuResult.rows[0].face_descriptor;
  const distance = euclidean(stored, descriptor);
  const confidence = Math.max(0, Math.min(1, 1 - distance));

  if (distance >= MATCH_THRESHOLD) {
    res.status(403).json({
      error: "Face verification failed. Your face does not match. Please try again.",
      confidence: parseFloat(confidence.toFixed(4)),
    });
    return;
  }

  // Determine if late
  let attStatus = "present";
  if (session.allow_late_minutes > 0) {
    const [sh, sm] = session.start_time.split(":").map(Number);
    const startMs = (sh * 60 + sm) * 60000;
    const [ch, cm] = currentTime.split(":").map(Number);
    const currMs = (ch * 60 + cm) * 60000;
    if (currMs > startMs + session.allow_late_minutes * 60000) {
      attStatus = "late";
    }
  }

  // Insert verification log
  await pool.query(
    `INSERT INTO cv_attendance_log(session_id, student_id, confidence, method, status)
     VALUES($1,$2,$3,'self','verified')`,
    [session_id, student_id, confidence]
  );

  // Also mark in main attendance table
  await pool.query(
    `INSERT INTO attendance(student_id, class_id, status, date)
     VALUES($1,$2,$3,$4)
     ON CONFLICT(student_id, class_id, date) DO UPDATE SET status = EXCLUDED.status`,
    [student_id, session.class_id, attStatus, today]
  );

  res.json({
    success: true,
    message: `Attendance verified successfully! Status: ${attStatus}`,
    confidence: parseFloat(confidence.toFixed(4)),
    status: attStatus,
  });
});

/* ─── TEACHER VERIFY STUDENT (teacher uses own system) ─── */
router.post("/cv-teacher-verify", async (req: Request, res: Response): Promise<void> => {
  const { session_id, student_id, teacher_id, teacher_descriptor } = req.body;
  if (!session_id || !student_id || !teacher_id || !teacher_descriptor) {
    res.status(400).json({ error: "session_id, student_id, teacher_id, teacher_descriptor required." });
    return;
  }

  // Verify teacher identity first
  const teacherResult = await pool.query(
    `SELECT face_descriptor FROM teachers WHERE teacher_id = $1`,
    [teacher_id]
  );
  if (!teacherResult.rows[0]?.face_descriptor) {
    res.status(400).json({ error: "Teacher face not registered." });
    return;
  }

  const tDistance = euclidean(teacherResult.rows[0].face_descriptor, teacher_descriptor);
  if (tDistance >= MATCH_THRESHOLD) {
    res.status(403).json({ error: "Teacher face verification failed." });
    return;
  }

  // Mark the student as verified by teacher
  const sessionResult = await pool.query(`SELECT * FROM cv_attendance_sessions WHERE session_id=$1`, [session_id]);
  if (sessionResult.rows.length === 0) {
    res.status(404).json({ error: "Session not found." });
    return;
  }

  const session = sessionResult.rows[0];
  const { date: today } = localNow();

  await pool.query(
    `INSERT INTO cv_attendance_log(session_id, student_id, confidence, method, status)
     VALUES($1,$2,1.0,'teacher','verified')
     ON CONFLICT(session_id, student_id) DO UPDATE SET method='teacher', confidence=1.0`,
    [session_id, student_id]
  );

  await pool.query(
    `INSERT INTO attendance(student_id, class_id, status, date)
     VALUES($1,$2,'present',$3)
     ON CONFLICT(student_id, class_id, date) DO UPDATE SET status = 'present'`,
    [student_id, session.class_id, today]
  );

  res.json({ success: true, message: "Student verified by teacher." });
});

/* ─── GET SESSION VERIFICATION LOG ─── */
router.get("/cv-sessions/:id/log", async (req: Request, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT l.*, s.first_name, s.last_name, s.email, s.face_registered
     FROM cv_attendance_log l
     JOIN students s ON l.student_id = s.student_id
     WHERE l.session_id = $1
     ORDER BY l.verified_at`,
    [req.params.id]
  );
  res.json(result.rows);
});

/* ─── GET UNVERIFIED STUDENTS FOR A SESSION ─── */
router.get("/cv-sessions/:id/unverified", async (req: Request, res: Response): Promise<void> => {
  const sessionResult = await pool.query(`SELECT class_id FROM cv_attendance_sessions WHERE session_id=$1`, [req.params.id]);
  if (sessionResult.rows.length === 0) {
    res.json([]);
    return;
  }
  const classId = sessionResult.rows[0].class_id;

  const result = await pool.query(
    `SELECT s.student_id, s.first_name, s.last_name, s.email, s.face_registered
     FROM students s
     JOIN student_class_assignments sca ON s.student_id = sca.student_id
     WHERE sca.class_id = $1 AND sca.status = 'active' AND s.status = 'approved'
       AND s.student_id NOT IN (SELECT student_id FROM cv_attendance_log WHERE session_id = $2)
     ORDER BY s.first_name, s.last_name`,
    [classId, req.params.id]
  );
  res.json(result.rows);
});

/* ═══════════════════════════════════════════════════════════
   FACE RE-VERIFY REQUESTS
   ═══════════════════════════════════════════════════════════ */

// Student: submit a re-verify request
router.post("/reverify-request", async (req: Request, res: Response): Promise<void> => {
  const { student_id, reason } = req.body;
  if (!student_id || !reason) {
    res.status(400).json({ error: "student_id and reason required." });
    return;
  }

  // Check if already has a pending request
  const existing = await pool.query(
    `SELECT request_id FROM face_reverify_requests WHERE student_id = $1 AND status = 'pending'`,
    [student_id]
  );
  if (existing.rows.length > 0) {
    res.status(400).json({ error: "You already have a pending re-verify request." });
    return;
  }

  await pool.query(
    `INSERT INTO face_reverify_requests(student_id, reason) VALUES($1, $2)`,
    [student_id, reason]
  );

  // Notify all teachers about this request
  const student = await pool.query(
    `SELECT first_name, last_name FROM students WHERE student_id = $1`, [student_id]
  );
  const stuName = student.rows[0] ? `${student.rows[0].first_name} ${student.rows[0].last_name}` : "A student";
  const teachers = await pool.query(`SELECT teacher_id FROM teachers`);
  for (const t of teachers.rows) {
    await pool.query(
      `INSERT INTO notifications(recipient_role, recipient_id, type, title, message)
       VALUES('teacher', $1, 'reverify_request', $2, $3)`,
      [t.teacher_id, "Face Re-verify Request", `${stuName} has requested to re-register their face. Reason: ${reason}`]
    ).catch(() => {});
  }

  res.json({ success: true, message: "Re-verify request submitted. A teacher will review it." });
});

// Student: check their request status
router.get("/reverify-request/status", async (req: Request, res: Response): Promise<void> => {
  const { student_id } = req.query;
  if (!student_id) {
    res.status(400).json({ error: "student_id required." });
    return;
  }

  const result = await pool.query(
    `SELECT r.*, t.first_name AS reviewer_first, t.last_name AS reviewer_last
     FROM face_reverify_requests r
     LEFT JOIN teachers t ON r.reviewed_by = t.teacher_id
     WHERE r.student_id = $1
     ORDER BY r.created_at DESC LIMIT 1`,
    [student_id]
  );

  if (result.rows.length === 0) {
    res.json({ has_request: false });
    return;
  }

  res.json({ has_request: true, request: result.rows[0] });
});

// Teacher: list all pending re-verify requests
router.get("/reverify-requests", async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query;
  const filter = status ? `WHERE r.status = $1` : `WHERE r.status = 'pending'`;
  const params = status ? [status] : [];

  const result = await pool.query(
    `SELECT r.*, s.first_name, s.last_name, s.email, s.face_photo,
            t.first_name AS reviewer_first, t.last_name AS reviewer_last
     FROM face_reverify_requests r
     JOIN students s ON r.student_id = s.student_id
     LEFT JOIN teachers t ON r.reviewed_by = t.teacher_id
     ${filter}
     ORDER BY r.created_at DESC`,
    params
  );
  res.json(result.rows);
});

// Teacher: approve or reject a re-verify request
router.put("/reverify-request/:id", async (req: Request, res: Response): Promise<void> => {
  const { status, teacher_id } = req.body;
  if (!status || !teacher_id) {
    res.status(400).json({ error: "status and teacher_id required." });
    return;
  }

  if (status !== "approved" && status !== "rejected") {
    res.status(400).json({ error: "status must be 'approved' or 'rejected'." });
    return;
  }

  const result = await pool.query(
    `UPDATE face_reverify_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW()
     WHERE request_id = $3 RETURNING *`,
    [status, teacher_id, req.params.id]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: "Request not found." });
    return;
  }

  const request = result.rows[0];

  // If approved, unlock student's face (reset face_registered so they can re-register)
  if (status === "approved") {
    await pool.query(
      `UPDATE students SET face_registered = FALSE, face_descriptor = NULL, face_photo = NULL WHERE student_id = $1`,
      [request.student_id]
    );
  }

  // Notify the student
  const statusLabel = status === "approved" ? "approved" : "rejected";
  await pool.query(
    `INSERT INTO notifications(recipient_role, recipient_id, type, title, message)
     VALUES('student', $1, 'reverify_response', $2, $3)`,
    [request.student_id, `Face Re-verify ${status.charAt(0).toUpperCase() + status.slice(1)}`,
     status === "approved"
       ? "Your face re-verify request has been approved. You can now register a new face."
       : "Your face re-verify request has been rejected."]
  ).catch(() => {});

  res.json({ success: true, message: `Request ${statusLabel}.` });
});

export default router;
