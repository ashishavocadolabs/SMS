import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async(req,res)=>{

  const result = await pool.query(`
    SELECT * FROM classes
  `);

  res.json(result.rows);

});

router.post("/", async(req,res)=>{

  const {class_name,section,grade} = req.body;

  const result = await pool.query(`

    INSERT INTO classes(
    class_name,
    section,
    grade
    )

    VALUES($1,$2,$3)

    RETURNING *

  `,[class_name,section,grade]);

  res.json(result.rows[0]);

});

export default router;