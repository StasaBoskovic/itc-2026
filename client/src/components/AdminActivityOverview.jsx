import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api, authConfig, resolveAssetUrl } from "../api";
import Avatar from "./Avatar";
import StarRating from "./StarRating";
import { getUserDisplayName } from "../utils/user";

function formatActivityDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("sr-RS", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function truncateText(value, limit = 140) {
  if (!value) {
    return "";
  }

  const normalized = value.trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit).trim()}...`;
}

function EmptyActivityState({ message }) {
  return <div className="page-state admin-empty-state">{message}</div>;
}

export default function AdminActivityOverview({ token }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(
          "/users/me/activity-overview",
          authConfig(token)
        );

        if (active) {
          setOverview(data);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError.response?.data?.message ||
              "Ne mogu da ucitam aktivnosti korisnika."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      active = false;
    };
  }, [token]);

  const summaryItems = [
    {
      label: "zabiljezenih prijava",
      value: overview?.summary?.login_count || 0,
    },
    {
      label: "aktivnih korisnika",
      value: overview?.summary?.active_user_count || 0,
    },
    {
      label: "objavljenih komentara",
      value: overview?.summary?.comment_count || 0,
    },
    {
      label: "dodatih slika",
      value: overview?.summary?.image_count || 0,
    },
    {
      label: "ocjena staza",
      value: overview?.summary?.rating_count || 0,
    },
  ];

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Admin aktivnosti</span>
          <h2>Pregled aktivnosti korisnika</h2>
        </div>
        <p>Prijave, komentari, slike i ocjene rasporedjene po cjelinama.</p>
      </div>

      {loading && <div className="page-state">Ucitavanje aktivnosti...</div>}
      {!loading && error && <div className="page-state error-state">{error}</div>}

      {!loading && !error && overview && (
        <>
          <div className="profile-stat-grid admin-activity-stat-grid">
            {summaryItems.map((item) => (
              <div key={item.label} className="hero-stat-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="admin-activity-grid">
            <article className="panel admin-activity-panel">
              <div className="admin-activity-panel-head">
                <div>
                  <span className="eyebrow">Prijave</span>
                  <h3>Ko se i kada prijavio</h3>
                </div>
                <small>{overview.recent_logins?.length || 0} posljednjih unosa</small>
              </div>

              {overview.recent_logins?.length ? (
                <div className="admin-activity-list">
                  {overview.recent_logins.map((login) => (
                    <div key={login.id} className="admin-activity-item">
                      <div className="admin-activity-item-head">
                        <div className="admin-activity-user">
                          <Avatar user={login} size="small" />
                          <div className="admin-activity-user-copy">
                            <strong>{getUserDisplayName(login)}</strong>
                            <small>@{login.username_snapshot || login.username}</small>
                          </div>
                        </div>
                        <span className="admin-activity-time">
                          {formatActivityDate(login.logged_in_at)}
                        </span>
                      </div>

                      <p className="admin-activity-note">
                        Profil korisnika:{" "}
                        <Link
                          to={`/users/${login.user_id}`}
                          className="admin-activity-link"
                        >
                          otvori pregled
                        </Link>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyActivityState message="Jos nema zabiljezenih prijava korisnika." />
              )}
            </article>

            <article className="panel admin-activity-panel">
              <div className="admin-activity-panel-head">
                <div>
                  <span className="eyebrow">Ocjene</span>
                  <h3>Kako su korisnici ocijenili staze</h3>
                </div>
                <small>{overview.recent_ratings?.length || 0} posljednjih ocjena</small>
              </div>

              {overview.recent_ratings?.length ? (
                <div className="admin-activity-list">
                  {overview.recent_ratings.map((rating) => (
                    <div
                      key={`${rating.user_id}-${rating.trail_id}-${rating.created_at}`}
                      className="admin-activity-item"
                    >
                      <div className="admin-activity-item-head">
                        <div className="admin-activity-user">
                          <Avatar user={rating} size="small" />
                          <div className="admin-activity-user-copy">
                            <strong>{getUserDisplayName(rating)}</strong>
                            <small>
                              Staza: <Link to={`/trails/${rating.trail_id}`}>{rating.trail_name}</Link>
                            </small>
                          </div>
                        </div>
                        <span className="admin-activity-time">
                          {formatActivityDate(rating.created_at)}
                        </span>
                      </div>

                      <div className="admin-activity-rating-row">
                        <StarRating value={rating.stars} readOnly />
                        <strong>{rating.stars} / 5</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyActivityState message="Korisnici jos nijesu ostavili ocjene za staze." />
              )}
            </article>

            <article className="panel admin-activity-panel admin-activity-panel-wide">
              <div className="admin-activity-panel-head">
                <div>
                  <span className="eyebrow">Komentari</span>
                  <h3>Sta su komentarisali</h3>
                </div>
                <small>{overview.recent_comments?.length || 0} posljednjih komentara</small>
              </div>

              {overview.recent_comments?.length ? (
                <div className="admin-activity-list">
                  {overview.recent_comments.map((comment) => (
                    <div key={comment.id} className="admin-activity-item">
                      <div className="admin-activity-item-head">
                        <div className="admin-activity-user">
                          <Avatar user={comment} size="small" />
                          <div className="admin-activity-user-copy">
                            <strong>{getUserDisplayName(comment)}</strong>
                            <small>
                              Na stazi: <Link to={`/trails/${comment.trail_id}`}>{comment.trail_name}</Link>
                            </small>
                          </div>
                        </div>
                        <span className="admin-activity-time">
                          {formatActivityDate(comment.created_at)}
                        </span>
                      </div>

                      <p className="admin-activity-quote">{comment.comment_text}</p>

                      <div className="admin-activity-meta">
                        <span className="admin-activity-chip">
                          @{comment.username}
                        </span>
                        <span className="admin-activity-chip">
                          {comment.image_count || 0} slika uz komentar
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyActivityState message="Jos nema korisnickih komentara za prikaz." />
              )}
            </article>

            <article className="panel admin-activity-panel admin-activity-panel-wide">
              <div className="admin-activity-panel-head">
                <div>
                  <span className="eyebrow">Slike</span>
                  <h3>Kakve su slike dodavali</h3>
                </div>
                <small>{overview.recent_images?.length || 0} posljednjih slika</small>
              </div>

              {overview.recent_images?.length ? (
                <div className="admin-activity-gallery">
                  {overview.recent_images.map((image) => (
                    <div key={image.id} className="admin-activity-image-card">
                      <img
                        src={resolveAssetUrl(image.image_url)}
                        alt={`Slika koju je dodao ${getUserDisplayName(image)}`}
                        className="admin-activity-image"
                      />

                      <div className="admin-activity-image-copy">
                        <strong>{getUserDisplayName(image)}</strong>
                        <small>
                          <Link to={`/trails/${image.trail_id}`}>{image.trail_name}</Link>
                        </small>
                        <span>{formatActivityDate(image.created_at)}</span>
                        <p>{truncateText(image.comment_text, 110)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyActivityState message="Korisnici jos nijesu dodali slike uz komentare." />
              )}
            </article>
          </div>
        </>
      )}
    </section>
  );
}
