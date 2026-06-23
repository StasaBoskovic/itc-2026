import express from "express";

import { query } from "../db.js";
import {
  attachUserIfPresent,
  requireAuth,
  requireStandardUser,
} from "../middleware/auth.js";
import { profileImageUpload } from "../middleware/upload.js";
import {
  getPublicUserProfile,
  getUserIdentityById,
  serializeUserIdentity,
} from "../userProfile.js";

const router = express.Router();

router.use(attachUserIfPresent);

function normalizeOptionalText(value) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeAge(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const age = Number(value);

  if (!Number.isInteger(age) || age < 0 || age > 120) {
    return null;
  }

  return age;
}

async function trailExists(trailId) {
  const result = await query("SELECT id FROM trails WHERE id = $1", [trailId]);
  return Boolean(result.rows[0]);
}

router.get("/me", requireAuth, async (req, res, next) => {
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

router.put("/me", requireAuth, profileImageUpload, async (req, res, next) => {
  try {
    const { first_name, last_name, age, bio } = req.body;
    const normalizedAge = normalizeAge(age);

    if (age && normalizedAge === null) {
      return res
        .status(400)
        .json({ message: "Godine moraju biti cijeli broj izmedju 0 i 120." });
    }

    const imageUrl = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : undefined;

    const { rows } = await query(
      `
        UPDATE app_users
        SET
          first_name = $1,
          last_name = $2,
          age = $3,
          bio = $4,
          profile_image_url = COALESCE($5, profile_image_url)
        WHERE id = $6
        RETURNING id
      `,
      [
        normalizeOptionalText(first_name),
        normalizeOptionalText(last_name),
        normalizedAge,
        normalizeOptionalText(bio),
        imageUrl,
        req.user.id,
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Korisnik nije pronadjen." });
    }

    const updatedUser = await getUserIdentityById(req.user.id);

    res.json({
      message: "Profil je uspjesno sacuvan.",
      user: serializeUserIdentity(updatedUser),
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/me/favorites/:trailId",
  requireAuth,
  requireStandardUser,
  async (req, res, next) => {
  try {
    const trailId = Number(req.params.trailId);

    if (!Number.isInteger(trailId)) {
      return res.status(400).json({ message: "Neispravan ID staze." });
    }

    if (!(await trailExists(trailId))) {
      return res.status(404).json({ message: "Staza nije pronadjena." });
    }

    await query(
      `
        INSERT INTO favorite_trails (user_id, trail_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, trail_id) DO NOTHING
      `,
      [req.user.id, trailId]
    );

    res.json({
      message: "Staza je dodata u omiljene.",
      is_favorite: true,
    });
  } catch (error) {
    next(error);
  }
  }
);

router.delete(
  "/me/favorites/:trailId",
  requireAuth,
  requireStandardUser,
  async (req, res, next) => {
  try {
    const trailId = Number(req.params.trailId);

    if (!Number.isInteger(trailId)) {
      return res.status(400).json({ message: "Neispravan ID staze." });
    }

    await query(
      "DELETE FROM favorite_trails WHERE user_id = $1 AND trail_id = $2",
      [req.user.id, trailId]
    );

    res.json({
      message: "Staza je uklonjena iz omiljenih.",
      is_favorite: false,
    });
  } catch (error) {
    next(error);
  }
  }
);

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({ message: "Neispravan ID korisnika." });
    }

    const profile = await getPublicUserProfile(userId);

    if (!profile) {
      return res.status(404).json({ message: "Profil nije pronadjen." });
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

export default router;
