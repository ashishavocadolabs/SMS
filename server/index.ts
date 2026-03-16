import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import studentRoutes from "./routes/students";
import teacherRoutes from "./routes/teachers";
import classRoutes from "./routes/classes";
import attendanceRoutes from "./routes/attendance";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>{
  res.send("SMS Backend Running");
});

/* ROUTES */

app.use("/api/students", studentRoutes);

app.use("/api/teachers", teacherRoutes);

app.use("/api/classes", classRoutes);

app.use("/api/attendance", attendanceRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
  console.log(`Server running on port ${PORT}`);
});