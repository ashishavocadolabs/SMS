import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.post("/", async(req,res)=>{

  const {student_id,class_id,status,date} = req.body;

  await pool.query(`

    INSERT INTO attendance(
      student_id,
      class_id,
      status,
      date
    )

    VALUES($1,$2,$3,$4)

  `,[student_id,class_id,status,date]);

  res.json({
    success:true
  });

});

export default router;