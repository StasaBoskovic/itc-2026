import express from "express";

import { pool, query } from "../db.js";
import {
  attachUserIfPresent,
  requireAdmin,
  requireAuth,
  requireStandardUser,
} from "../middleware/auth.js";
import {
  commentImagesUpload,
  trailGalleryUpload,
} from "../middleware/upload.js";
import { getUserIdentityById } from "../userProfile.js";

const router = express.Router();

router.use(attachUserIfPresent);

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return String(value).toLowerCase() === "true";
}

function parseIdList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(Number).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.map(Number).filter(Boolean);
    }
  } catch (_error) {
    return String(value)
      .split(",")
      .map((item) => Number(item.trim()))
      .filter(Boolean);
  }

  return [];
}

async function updateAverageRating(trailId, client = pool) {
  await client.query(
    `
      UPDATE trails
      SET average_rating = (
        SELECT COALESCE(ROUND(AVG(ratings.stars)::numeric, 2), 0)
        FROM ratings
        JOIN app_users ON app_users.id = ratings.user_id
        JOIN roles ON roles.id = app_users.role_id
        WHERE ratings.trail_id = $1
          AND roles.role_name = 'user'
      )
      WHERE id = $1
    `,
    [trailId]
  );
}

async function trailExists(trailId, client = pool) {
  const result = await client.query("SELECT id FROM trails WHERE id = $1", [trailId]);
  return Boolean(result.rows[0]);
}

router.get("/", async (req, res, next) => {
  try {
    const values = [];
    const conditions = [];
    const { search, city, difficultyId } = req.query;

    if (search) {
      values.push(`%${search}%`);
      conditions.push(
        `(t.name ILIKE $${values.length} OR t.city ILIKE $${values.length})`
      );
    }

    if (city) {
      values.push(`%${city}%`);
      conditions.push(`t.city ILIKE $${values.length}`);
    }

    if (difficultyId) {
      values.push(Number(difficultyId));
      conditions.push(`t.difficulty_id = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const { rows } = await query(
      `
        SELECT
          t.id,
          t.name,
          t.city,
          t.length_km,
          t.elevation_gain,
          t.highest_point,
          (
            SELECT COALESCE(ROUND(AVG(ratings.stars)::numeric, 2), 0)
            FROM ratings
            JOIN app_users ON app_users.id = ratings.user_id
            JOIN roles ON roles.id = app_users.role_id
            WHERE ratings.trail_id = t.id
              AND roles.role_name = 'user'
          ) AS average_rating,
          (
            SELECT COUNT(*)::int
            FROM ratings
            JOIN app_users ON app_users.id = ratings.user_id
            JOIN roles ON roles.id = app_users.role_id
            WHERE ratings.trail_id = t.id
              AND roles.role_name = 'user'
          ) AS rating_count,
          t.camping_allowed,
          t.description,
          d.name AS difficulty,
          e.status_name AS ecological_status,
          (
            SELECT image_url
            FROM trail_gallery
            WHERE trail_id = t.id
            ORDER BY id
            LIMIT 1
          ) AS cover_image
        FROM trails t
        JOIN difficulty_levels d ON d.id = t.difficulty_id
        JOIN ecological_statuses e ON e.id = t.ecological_status_id
        ${whereClause}
        ORDER BY t.created_at DESC, t.id DESC
      `,
      values
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const trailId = Number(req.params.id);

    if (!Number.isInteger(trailId)) {
      return res.status(400).json({ message: "Neispravan ID staze." });
    }

    const trailResult = await query(
      `
        SELECT
          t.*,
          (
            SELECT COALESCE(ROUND(AVG(ratings.stars)::numeric, 2), 0)
            FROM ratings
            JOIN app_users ON app_users.id = ratings.user_id
            JOIN roles ON roles.id = app_users.role_id
            WHERE ratings.trail_id = t.id
              AND roles.role_name = 'user'
          ) AS average_rating,
          (
            SELECT COUNT(*)::int
            FROM ratings
            JOIN app_users ON app_users.id = ratings.user_id
            JOIN roles ON roles.id = app_users.role_id
            WHERE ratings.trail_id = t.id
              AND roles.role_name = 'user'
          ) AS rating_count,
          d.name AS difficulty,
          e.status_name AS ecological_status,
          u.username AS created_by_username
        FROM trails t
        JOIN difficulty_levels d ON d.id = t.difficulty_id
        JOIN ecological_statuses e ON e.id = t.ecological_status_id
        JOIN app_users u ON u.id = t.created_by
        WHERE t.id = $1
      `,
      [trailId]
    );

    const trail = trailResult.rows[0];

    if (!trail) {
      return res.status(404).json({ message: "Staza nije pronadjena." });
    }

    const [galleryResult, terrainsResult, commentsResult] = await Promise.all([
      query(
        "SELECT id, image_url FROM trail_gallery WHERE trail_id = $1 ORDER BY id",
        [trailId]
      ),
      query(
        `
          SELECT terrain_types.id, terrain_types.name
          FROM trail_terrain
          JOIN terrain_types ON terrain_types.id = trail_terrain.terrain_id
          WHERE trail_terrain.trail_id = $1
          ORDER BY terrain_types.name
        `,
        [trailId]
      ),
      query(
        `
          SELECT
            comments.id,
            comments.comment_text,
            comments.created_at,
            app_users.id AS user_id,
            app_users.username,
            app_users.first_name,
            app_users.last_name,
            app_users.age,
            app_users.bio,
            app_users.profile_image_url,
            COALESCE(
              json_agg(
                json_build_object('id', comment_images.id, 'image_url', comment_images.image_url)
              ) FILTER (WHERE comment_images.id IS NOT NULL),
              '[]'::json
            ) AS images
          FROM comments
          JOIN app_users ON app_users.id = comments.user_id
          JOIN roles ON roles.id = app_users.role_id
          LEFT JOIN comment_images ON comment_images.comment_id = comments.id
          WHERE comments.trail_id = $1
            AND roles.role_name = 'user'
          GROUP BY
            comments.id,
            app_users.id,
            app_users.username,
            app_users.first_name,
            app_users.last_name,
            app_users.age,
            app_users.bio,
            app_users.profile_image_url
          ORDER BY comments.created_at DESC
        `,
        [trailId]
      ),
    ]);

    let userRating = null;
    let isFavorite = false;

    if (req.user?.role === "user") {
      const favoriteResult = await query(
        "SELECT id FROM favorite_trails WHERE user_id = $1 AND trail_id = $2",
        [req.user.id, trailId]
      );

      isFavorite = Boolean(favoriteResult.rows[0]);
    }

    if (req.user?.role === "user") {
      const ratingResult = await query(
        "SELECT stars FROM ratings WHERE user_id = $1 AND trail_id = $2",
        [req.user.id, trailId]
      );

      userRating = ratingResult.rows[0]?.stars || null;
    }

    res.json({
      ...trail,
      gallery: galleryResult.rows,
      terrains: terrainsResult.rows,
      comments: commentsResult.rows,
      userRating,
      is_favorite: isFavorite,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireAdmin, trailGalleryUpload, async (req, res, next) => {
  const client = await pool.connect();

  try {
    const {
      name,
      city,
      start_lat,
      start_lng,
      end_lat,
      end_lng,
      length_km,
      elevation_gain,
      highest_point,
      difficulty_id,
      ecological_status_id,
      camping_allowed,
      description,
      terrain_ids,
    } = req.body;

    if (
      !name ||
      !city ||
      !start_lat ||
      !start_lng ||
      !end_lat ||
      !end_lng ||
      !length_km ||
      !elevation_gain ||
      !highest_point ||
      !difficulty_id ||
      !ecological_status_id
    ) {
      return res
        .status(400)
        .json({ message: "Sva osnovna polja za stazu su obavezna." });
    }

    const terrainIds = parseIdList(terrain_ids);

    await client.query("BEGIN");

    const trailInsert = await client.query(
      `
        INSERT INTO trails (
          name,
          city,
          start_lat,
          start_lng,
          end_lat,
          end_lng,
          length_km,
          elevation_gain,
          highest_point,
          difficulty_id,
          ecological_status_id,
          camping_allowed,
          description,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `,
      [
        name.trim(),
        city.trim(),
        Number(start_lat),
        Number(start_lng),
        Number(end_lat),
        Number(end_lng),
        Number(length_km),
        Number(elevation_gain),
        Number(highest_point),
        Number(difficulty_id),
        Number(ecological_status_id),
        parseBoolean(camping_allowed),
        description?.trim() || null,
        req.user.id,
      ]
    );

    const trailId = trailInsert.rows[0].id;

    for (const terrainId of terrainIds) {
      await client.query(
        "INSERT INTO trail_terrain (trail_id, terrain_id) VALUES ($1, $2)",
        [trailId, terrainId]
      );
    }

    if (req.files?.length) {
      for (const file of req.files) {
        await client.query(
          "INSERT INTO trail_gallery (trail_id, image_url) VALUES ($1, $2)",
          [trailId, `/uploads/trails/${file.filename}`]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Staza je uspjesno dodata.",
      trailId,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

router.post("/:id/rating", requireAuth, requireStandardUser, async (req, res, next) => {
  try {
    const trailId = Number(req.params.id);
    const stars = Number(req.body.stars);

    if (!Number.isInteger(trailId)) {
      return res.status(400).json({ message: "Neispravan ID staze." });
    }

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Ocjena mora biti od 1 do 5." });
    }

    if (!(await trailExists(trailId))) {
      return res.status(404).json({ message: "Staza nije pronadjena." });
    }

    await query(
      `
        INSERT INTO ratings (user_id, trail_id, stars)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, trail_id)
        DO UPDATE SET stars = EXCLUDED.stars, created_at = CURRENT_TIMESTAMP
      `,
      [req.user.id, trailId, stars]
    );

    await updateAverageRating(trailId);

    const trailResult = await query(
      `
        SELECT
          t.average_rating,
          (
            SELECT COUNT(*)::int
            FROM ratings
            JOIN app_users ON app_users.id = ratings.user_id
            JOIN roles ON roles.id = app_users.role_id
            WHERE ratings.trail_id = t.id
              AND roles.role_name = 'user'
          ) AS rating_count
        FROM trails t
        WHERE t.id = $1
      `,
      [trailId]
    );

    res.json({
      message: "Ocjena je sacuvana.",
      average_rating: trailResult.rows[0]?.average_rating || 0,
      rating_count: trailResult.rows[0]?.rating_count || 0,
      user_rating: stars,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:id/comments",
  requireAuth,
  requireStandardUser,
  commentImagesUpload,
  async (req, res, next) => {
    const client = await pool.connect();

    try {
      const trailId = Number(req.params.id);
      const { comment_text } = req.body;

      if (!Number.isInteger(trailId)) {
        return res.status(400).json({ message: "Neispravan ID staze." });
      }

      if (!comment_text?.trim()) {
        return res.status(400).json({ message: "Komentar je obavezan." });
      }

      if (!(await trailExists(trailId, client))) {
        return res.status(404).json({ message: "Staza nije pronadjena." });
      }

      await client.query("BEGIN");

      const commentInsert = await client.query(
        `
          INSERT INTO comments (user_id, trail_id, comment_text)
          VALUES ($1, $2, $3)
          RETURNING id, comment_text, created_at
        `,
        [req.user.id, trailId, comment_text.trim()]
      );

      const comment = commentInsert.rows[0];
      const images = [];

      if (req.files?.length) {
        for (const file of req.files) {
          const imageUrl = `/uploads/comments/${file.filename}`;
          const imageInsert = await client.query(
            "INSERT INTO comment_images (comment_id, image_url) VALUES ($1, $2) RETURNING id, image_url",
            [comment.id, imageUrl]
          );
          images.push(imageInsert.rows[0]);
        }
      }

      await client.query("COMMIT");

      const commentAuthor = await getUserIdentityById(req.user.id);

      res.status(201).json({
        id: comment.id,
        comment_text: comment.comment_text,
        created_at: comment.created_at,
        user_id: req.user.id,
        username: req.user.username,
        first_name: commentAuthor?.first_name || "",
        last_name: commentAuthor?.last_name || "",
        age: commentAuthor?.age ?? null,
        bio: commentAuthor?.bio || "",
        profile_image_url: commentAuthor?.profile_image_url || "",
        images,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      next(error);
    } finally {
      client.release();
    }
  }
);

export default router;
