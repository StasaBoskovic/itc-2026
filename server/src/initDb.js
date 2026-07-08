import { pool } from "./db.js";

export async function ensureSchema() {
  await pool.query(`
    ALTER TABLE trails
    ADD COLUMN IF NOT EXISTS route_map_data JSONB
  `);

  await pool.query(`
    ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(60),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(60),
    ADD COLUMN IF NOT EXISTS age INT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS profile_image_url TEXT
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS favorite_trails (
      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id INT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      trail_id INT NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_favorite UNIQUE (user_id, trail_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_login_activity (
      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id INT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      username_snapshot VARCHAR(120) NOT NULL,
      logged_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_login_activity_user_time
    ON user_login_activity (user_id, logged_in_at DESC)
  `);
}
