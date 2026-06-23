import dotenv from "dotenv";

import app from "./app.js";
import { pool } from "./db.js";
import { ensureSchema } from "./initDb.js";

dotenv.config();

const port = Number(process.env.PORT || 5000);

async function start() {
  try {
    await ensureSchema();
    await pool.query("SELECT 1");
    app.listen(port, () => {
      console.log(`MonTrails server radi na portu ${port}`);
    });
  } catch (error) {
    console.error("Server nije pokrenut zbog greske:", error);
    process.exit(1);
  }
}

start();
