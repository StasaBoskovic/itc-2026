import { query } from "./db.js";

function normalizeNumber(value) {
  return Number(value || 0);
}

export async function recordUserLoginActivity({ userId, username }) {
  if (!userId || !username) {
    return;
  }

  try {
    await query(
      `
        INSERT INTO user_login_activity (user_id, username_snapshot)
        VALUES ($1, $2)
      `,
      [userId, username]
    );
  } catch (error) {
    console.error("Ne mogu da sacuvam login aktivnost:", error);
  }
}

export async function getAdminActivityOverview({
  loginLimit = 12,
  commentLimit = 8,
  imageLimit = 12,
  ratingLimit = 12,
} = {}) {
  const [
    summaryResult,
    loginResult,
    commentResult,
    imageResult,
    ratingResult,
  ] = await Promise.all([
    query(`
      WITH activity_users AS (
        SELECT DISTINCT user_id
        FROM (
          SELECT user_login_activity.user_id
          FROM user_login_activity
          JOIN app_users ON app_users.id = user_login_activity.user_id
          JOIN roles ON roles.id = app_users.role_id
          WHERE roles.role_name = 'user'

          UNION

          SELECT comments.user_id
          FROM comments
          JOIN app_users ON app_users.id = comments.user_id
          JOIN roles ON roles.id = app_users.role_id
          WHERE roles.role_name = 'user'

          UNION

          SELECT ratings.user_id
          FROM ratings
          JOIN app_users ON app_users.id = ratings.user_id
          JOIN roles ON roles.id = app_users.role_id
          WHERE roles.role_name = 'user'
        ) AS combined_activity
      )
      SELECT
        (
          SELECT COUNT(*)::int
          FROM user_login_activity
          JOIN app_users ON app_users.id = user_login_activity.user_id
          JOIN roles ON roles.id = app_users.role_id
          WHERE roles.role_name = 'user'
        ) AS login_count,
        (
          SELECT COUNT(*)::int
          FROM comments
          JOIN app_users ON app_users.id = comments.user_id
          JOIN roles ON roles.id = app_users.role_id
          WHERE roles.role_name = 'user'
        ) AS comment_count,
        (
          SELECT COUNT(*)::int
          FROM comment_images
          JOIN comments ON comments.id = comment_images.comment_id
          JOIN app_users ON app_users.id = comments.user_id
          JOIN roles ON roles.id = app_users.role_id
          WHERE roles.role_name = 'user'
        ) AS image_count,
        (
          SELECT COUNT(*)::int
          FROM ratings
          JOIN app_users ON app_users.id = ratings.user_id
          JOIN roles ON roles.id = app_users.role_id
          WHERE roles.role_name = 'user'
        ) AS rating_count,
        (SELECT COUNT(*)::int FROM activity_users) AS active_user_count
    `),
    query(
      `
        SELECT
          user_login_activity.id,
          user_login_activity.logged_in_at,
          user_login_activity.username_snapshot,
          app_users.id AS user_id,
          app_users.username,
          app_users.first_name,
          app_users.last_name,
          app_users.profile_image_url
        FROM user_login_activity
        JOIN app_users ON app_users.id = user_login_activity.user_id
        JOIN roles ON roles.id = app_users.role_id
        WHERE roles.role_name = 'user'
        ORDER BY user_login_activity.logged_in_at DESC, user_login_activity.id DESC
        LIMIT $1
      `,
      [loginLimit]
    ),
    query(
      `
        SELECT
          comments.id,
          comments.comment_text,
          comments.created_at,
          trails.id AS trail_id,
          trails.name AS trail_name,
          app_users.id AS user_id,
          app_users.username,
          app_users.first_name,
          app_users.last_name,
          app_users.profile_image_url,
          COALESCE(
            json_agg(
              json_build_object(
                'id',
                comment_images.id,
                'image_url',
                comment_images.image_url
              )
              ORDER BY comment_images.id
            ) FILTER (WHERE comment_images.id IS NOT NULL),
            '[]'::json
          ) AS images
        FROM comments
        JOIN app_users ON app_users.id = comments.user_id
        JOIN roles ON roles.id = app_users.role_id
        JOIN trails ON trails.id = comments.trail_id
        LEFT JOIN comment_images ON comment_images.comment_id = comments.id
        WHERE roles.role_name = 'user'
        GROUP BY
          comments.id,
          trails.id,
          trails.name,
          app_users.id,
          app_users.username,
          app_users.first_name,
          app_users.last_name,
          app_users.profile_image_url
        ORDER BY comments.created_at DESC, comments.id DESC
        LIMIT $1
      `,
      [commentLimit]
    ),
    query(
      `
        SELECT
          comment_images.id,
          comment_images.image_url,
          comments.id AS comment_id,
          comments.comment_text,
          comments.created_at,
          trails.id AS trail_id,
          trails.name AS trail_name,
          app_users.id AS user_id,
          app_users.username,
          app_users.first_name,
          app_users.last_name,
          app_users.profile_image_url
        FROM comment_images
        JOIN comments ON comments.id = comment_images.comment_id
        JOIN app_users ON app_users.id = comments.user_id
        JOIN roles ON roles.id = app_users.role_id
        JOIN trails ON trails.id = comments.trail_id
        WHERE roles.role_name = 'user'
        ORDER BY comments.created_at DESC, comment_images.id DESC
        LIMIT $1
      `,
      [imageLimit]
    ),
    query(
      `
        SELECT
          ratings.user_id,
          ratings.trail_id,
          ratings.stars,
          ratings.created_at,
          trails.name AS trail_name,
          app_users.username,
          app_users.first_name,
          app_users.last_name,
          app_users.profile_image_url
        FROM ratings
        JOIN app_users ON app_users.id = ratings.user_id
        JOIN roles ON roles.id = app_users.role_id
        JOIN trails ON trails.id = ratings.trail_id
        WHERE roles.role_name = 'user'
        ORDER BY ratings.created_at DESC, ratings.user_id DESC, ratings.trail_id DESC
        LIMIT $1
      `,
      [ratingLimit]
    ),
  ]);

  const summary = summaryResult.rows[0] || {};

  return {
    summary: {
      login_count: normalizeNumber(summary.login_count),
      comment_count: normalizeNumber(summary.comment_count),
      image_count: normalizeNumber(summary.image_count),
      rating_count: normalizeNumber(summary.rating_count),
      active_user_count: normalizeNumber(summary.active_user_count),
    },
    recent_logins: loginResult.rows,
    recent_comments: commentResult.rows.map((row) => ({
      ...row,
      image_count: Array.isArray(row.images) ? row.images.length : 0,
    })),
    recent_images: imageResult.rows,
    recent_ratings: ratingResult.rows.map((row) => ({
      ...row,
      stars: normalizeNumber(row.stars),
    })),
  };
}
