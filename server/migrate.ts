import fs from "fs";
import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: 5432,
      }
);

async function runMigration(file:string){

  const sql = fs.readFileSync(file).toString();

  await pool.query(sql);

  console.log(`${file} executed`);
}

async function migrate(){

  const folder = path.join(__dirname,"migrations");

  const files = fs.readdirSync(folder);

  for(const file of files){

    await runMigration(path.join(folder,file));

  }

}

migrate();