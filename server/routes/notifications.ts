import { Router } from "express";
import { pool } from "../db";

const router = Router();

/* GET notifications for a user */
router.get("/", async (req, res) => {
  try {
    const { role, user_id } = req.query;
    if (!role || !user_id) {
      res.status(400).json({ error: "role and user_id required" });
      return;
    }
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE recipient_role = $1 AND recipient_id = $2
       ORDER BY created_at DESC LIMIT 50`,
      [role, user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

/* GET unread count */
router.get("/unread-count", async (req, res) => {
  try {
    const { role, user_id } = req.query;
    if (!role || !user_id) {
      res.status(400).json({ error: "role and user_id required" });
      return;
    }
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications
       WHERE recipient_role = $1 AND recipient_id = $2 AND is_read = FALSE`,
      [role, user_id]
    );
    res.json({ count: result.rows[0].count });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch count." });
  }
});

/* PUT mark as read */
router.put("/:id/read", async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE notification_id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark read." });
  }
});

/* PUT mark all as read */
router.put("/read-all", async (req, res) => {
  try {
    const { role, user_id } = req.body;
    if (!role || !user_id) {
      res.status(400).json({ error: "role and user_id required" });
      return;
    }
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE recipient_role = $1 AND recipient_id = $2",
      [role, user_id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark all read." });
  }
});

export default router;
