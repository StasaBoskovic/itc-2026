import { query } from "./db.js";

function normalizeNumber(value) {
  return Number(value || 0);
}

export function serializeUserIdentity(row, { includeEmail = true } = {}) {
  if (!row) {
    return null;
  }

  const payload = {
    id: row.id,
    username: row.username,
    role: row.role_name,
    first_name: row.first_name || "",
    last_name: row.last_name || "",
    age: row.age,
    bio: row.bio || "",
    profile_image_url: row.profile_image_url || "",
    created_at: row.created_at,
  };

  if (includeEmail) {
    payload.email = row.email;
  }

  return payload;
}

export async function getUserIdentityById(userId) {
  const { rows } = await query(
    `
      SELECT
        app_users.id,
        app_users.username,
        app_users.email,
        app_users.first_name,
        app_users.last_name,
        app_users.age,
        app_users.bio,
        app_users.profile_image_url,
        app_users.created_at,
        roles.role_name
      FROM app_users
      JOIN roles ON roles.id = app_users.role_id
      WHERE app_users.id = $1
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function getFavoriteTrailsForUser(userId) {
  const { rows } = await query(
    `
      SELECT
        trails.id,
        trails.name,
        trails.city,
        trails.length_km,
        trails.elevation_gain,
        trails.highest_point,
        trails.average_rating,
        (
          SELECT COUNT(*)::int
          FROM ratings
          JOIN app_users ON app_users.id = ratings.user_id
          JOIN roles ON roles.id = app_users.role_id
          WHERE ratings.trail_id = trails.id
            AND roles.role_name = 'user'
        ) AS rating_count,
        trails.description,
        difficulty_levels.name AS difficulty,
        (
          SELECT image_url
          FROM trail_gallery
          WHERE trail_id = trails.id
          ORDER BY id
          LIMIT 1
        ) AS cover_image
      FROM favorite_trails
      JOIN trails ON trails.id = favorite_trails.trail_id
      JOIN difficulty_levels ON difficulty_levels.id = trails.difficulty_id
      WHERE favorite_trails.user_id = $1
      ORDER BY favorite_trails.created_at DESC, favorite_trails.id DESC
    `,
    [userId]
  );

  return rows;
}

export async function getPublicUserProfile(userId) {
  const identityRow = await getUserIdentityById(userId);

  if (!identityRow) {
    return null;
  }

  const supportsFavorites = identityRow.role_name === "user";

  const [favorites, countsResult] = await Promise.all([
    supportsFavorites ? getFavoriteTrailsForUser(userId) : Promise.resolve([]),
    query(
      `
        SELECT
          (SELECT COUNT(*) FROM comments WHERE user_id = $1) AS comment_count,
          ${
            supportsFavorites
              ? "(SELECT COUNT(*) FROM favorite_trails WHERE user_id = $1)"
              : "0"
          } AS favorite_count,
          (SELECT COUNT(*) FROM trails WHERE created_by = $1) AS added_trails_count
      `,
      [userId]
    ),
  ]);

  const counts = countsResult.rows[0];

  return {
    ...serializeUserIdentity(identityRow, { includeEmail: false }),
    comment_count: normalizeNumber(counts.comment_count),
    favorite_count: normalizeNumber(counts.favorite_count),
    added_trails_count: normalizeNumber(counts.added_trails_count),
    supports_favorites: supportsFavorites,
    favorites,
  };
}
