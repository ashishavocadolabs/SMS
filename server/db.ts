import { Pool, types } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Return DATE (OID 1082) as string instead of JS Date to avoid timezone shifts
types.setTypeParser(1082, (val: string) => val);

export const pool = new Pool(
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