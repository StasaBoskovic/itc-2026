import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";

import { attachUserIfPresent, requireAuth } from "../middleware/auth.js";
import { query } from "../db.js";

dotenv.config();

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role_name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email i password su obavezni." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password mora imati najmanje 6 karaktera." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await query(
      `
        WITH new_user AS (
          INSERT INTO app_users (username, email, password, role_id)
          SELECT $1, $2, $3, id
          FROM roles
          WHERE role_name = 'user'
          RETURNING id, username, email, created_at, role_id
        )
        SELECT new_user.id, new_user.username, new_user.email, new_user.created_at, roles.role_name
        FROM new_user
        JOIN roles ON roles.id = new_user.role_id
      `,
      [username.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    const user = rows[0];
    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role_name,
      },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "Username ili email vec postoji." });
    }

    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email i password su obavezni." });
    }

    const { rows } = await query(
      `
        SELECT app_users.id, app_users.username, app_users.email, app_users.password, roles.role_name
        FROM app_users
        JOIN roles ON roles.id = app_users.role_id
        WHERE app_users.email = $1
      `,
      [email.trim().toLowerCase()]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "Pogresan email ili password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Pogresan email ili password." });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role_name,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", attachUserIfPresent, requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `
        SELECT app_users.id, app_users.username, app_users.email, roles.role_name
        FROM app_users
        JOIN roles ON roles.id = app_users.role_id
        WHERE app_users.id = $1
      `,
      [req.user.id]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: "Korisnik nije pronadjen." });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role_name,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

