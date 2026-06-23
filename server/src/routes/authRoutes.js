import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";

import { attachUserIfPresent, requireAuth } from "../middleware/auth.js";
import { query } from "../db.js";
import { getUserIdentityById, serializeUserIdentity } from "../userProfile.js";

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
          RETURNING id
        )
        SELECT id
        FROM new_user
      `,
      [username.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    const identity = await getUserIdentityById(rows[0].id);
    const token = signToken(identity);

    res.status(201).json({
      token,
      user: serializeUserIdentity(identity),
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

    const fullUser = await getUserIdentityById(user.id);
    const token = signToken(user);

    res.json({
      token,
      user: serializeUserIdentity(fullUser),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", attachUserIfPresent, requireAuth, async (req, res, next) => {
  try {
    const user = await getUserIdentityById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Korisnik nije pronadjen." });
    }

    res.json(serializeUserIdentity(user));
  } catch (error) {
    next(error);
  }
});

export default router;
