import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async(req,res)=>{

  const result = await pool.query(`
    SELECT * FROM teachers
  `);

  res.json(result.rows);

});

router.post("/", async(req,res)=>{

  const {first_name,last_name,email,phone} = req.body;

  const result = await pool.query(`

    INSERT INTO teachers(
    first_name,
    last_name,
    email,
    phone
    )

    VALUES($1,$2,$3,$4)

    RETURNING *

  `,[first_name,last_name,email,phone]);

  res.json(result.rows[0]);

});

export default router;