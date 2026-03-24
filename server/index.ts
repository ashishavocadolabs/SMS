import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

import studentRoutes from "./routes/students";
import teacherRoutes from "./routes/teachers";
import classRoutes from "./routes/classes";
import attendanceRoutes from "./routes/attendance";
import subjectRoutes from "./routes/subjects";
import chapterRoutes from "./routes/chapters";
import noteRoutes from "./routes/notes";
import videoRoutes from "./routes/videos";
import lectureRoutes from "./routes/lectures";
import mcqRoutes from "./routes/mcq";
import performanceRoutes from "./routes/performance";
import notificationRoutes from "./routes/notifications";
import faceRoutes from "./routes/face";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/mcq", mcqRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/face", faceRoutes);

/* ─── Serve React frontend in production ─── */
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${ PORT }`);
});
