import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { api, authConfig, resolveAssetUrl } from "../api";
import StarRating from "../components/StarRating";
import { useAuth } from "../context/AuthContext";

export default function TrailDetailsPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [trail, setTrail] = useState(null);
  const [rating, setRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [commentImages, setCommentImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ratingMessage, setRatingMessage] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    async function loadTrail() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(`/trails/${id}`, authConfig(token));
        setTrail(data);
        setRating(Number(data.userRating || 0));
      } catch (_error) {
        setError("Ne mogu da ucitam detalje staze.");
      } finally {
        setLoading(false);
      }
    }

    loadTrail();
  }, [id, token]);

  async function handleRatingSubmit() {
    if (!user) {
      setRatingMessage("Prijavi se da bi ocijenio stazu.");
      return;
    }

    if (!rating) {
      setRatingMessage("Izaberi ocjenu od 1 do 5.");
      return;
    }

    setSubmittingRating(true);
    setRatingMessage("");

    try {
      const { data } = await api.post(
        `/trails/${id}/rating`,
        { stars: rating },
        authConfig(token)
      );

      setTrail((current) =>
        current
          ? {
              ...current,
              average_rating: data.average_rating,
              userRating: data.user_rating,
            }
          : current
      );
      setRatingMessage("Ocjena je sacuvana.");
    } catch (submissionError) {
      setRatingMessage(
        submissionError.response?.data?.message || "Ocjenjivanje nije uspjelo."
      );
    } finally {
      setSubmittingRating(false);
    }
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();

    if (!user) {
      setCommentMessage("Prijavi se da bi ostavio komentar.");
      return;
    }

    setSubmittingComment(true);
    setCommentMessage("");

    try {
      const formData = new FormData();
      formData.append("comment_text", commentText);

      commentImages.forEach((image) => {
        formData.append("images", image);
      });

      const { data } = await api.post(`/trails/${id}/comments`, formData, {
        ...authConfig(token),
        headers: {
          ...authConfig(token).headers,
          "Content-Type": "multipart/form-data",
        },
      });

      setTrail((current) =>
        current
          ? {
              ...current,
              comments: [data, ...(current.comments || [])],
            }
          : current
      );
      setCommentText("");
      setCommentImages([]);
      setCommentMessage("Komentar je dodat.");
    } catch (submissionError) {
      setCommentMessage(
        submissionError.response?.data?.message || "Komentar nije dodat."
      );
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading) {
    return <div className="page-state">Ucitavanje detalja staze...</div>;
  }

  if (error || !trail) {
    return <div className="page-state error-state">{error || "Nema podataka."}</div>;
  }

  return (
    <div className="page-stack">
      <section className="trail-hero">
        <div className="trail-hero-copy">
          <span className="eyebrow">{trail.city}</span>
          <h1>{trail.name}</h1>
          <p>{trail.description || "Opis staze jos nije dodat."}</p>

          <div className="detail-stats">
            <div className="stat-card">
              <strong>{trail.length_km} km</strong>
              <span>Duzina</span>
            </div>
            <div className="stat-card">
              <strong>{trail.elevation_gain} m</strong>
              <span>Uspon</span>
            </div>
            <div className="stat-card">
              <strong>{trail.highest_point} m</strong>
              <span>Najvisa tacka</span>
            </div>
            <div className="stat-card">
              <strong>{trail.difficulty}</strong>
              <span>Tezina</span>
            </div>
          </div>
        </div>

        <div className="panel summary-panel">
          <h2>Utisak zajednice</h2>
          <StarRating value={Number(trail.average_rating || 0)} readOnly size="large" />
          <p>{Number(trail.average_rating || 0).toFixed(1)} prosjecna ocjena</p>
          <p>Ekologija: {trail.ecological_status}</p>
          <p>
            Kampovanje: {trail.camping_allowed ? "Dozvoljeno" : "Nije dozvoljeno"}
          </p>
          <p>Dodao admin: {trail.created_by_username}</p>
        </div>
      </section>

      <section className="content-section two-column-layout">
        <div className="panel">
          <h2>Galerija staze</h2>
          <div className="gallery-grid">
            {(trail.gallery || []).length > 0 ? (
              trail.gallery.map((image) => (
                <img
                  key={image.id}
                  src={resolveAssetUrl(image.image_url)}
                  alt={trail.name}
                  className="gallery-image"
                />
              ))
            ) : (
              <img
                src={resolveAssetUrl("")}
                alt={trail.name}
                className="gallery-image"
              />
            )}
          </div>

          <div className="terrain-strip">
            {(trail.terrains || []).map((terrain) => (
              <span key={terrain.id} className="tag">
                {terrain.name}
              </span>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Ocijeni stazu</h2>
          <p>
            Prijavljeni korisnici mogu da daju ocjenu od 1 do 5 i ostave svoj
            vizuelni utisak uz komentar.
          </p>
          <StarRating value={rating} onChange={setRating} size="large" />
          <button
            type="button"
            className="primary-button"
            onClick={handleRatingSubmit}
            disabled={submittingRating}
          >
            {submittingRating ? "Cuvanje..." : "Sacuvaj ocjenu"}
          </button>

          {ratingMessage && <p className="form-success">{ratingMessage}</p>}
        </div>
      </section>

      <section className="content-section two-column-layout">
        <form className="panel" onSubmit={handleCommentSubmit}>
          <h2>Dodaj komentar</h2>
          <label className="field">
            <span>Tvoj utisak</span>
            <textarea
              rows="5"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Opisi sta ti se dopalo, da li je staza zahtjevna i kakvi su uslovi."
              required
            />
          </label>

          <label className="field">
            <span>Slike uz komentar</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                setCommentImages(Array.from(event.target.files || []))
              }
            />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={submittingComment}
          >
            {submittingComment ? "Objavljivanje..." : "Objavi komentar"}
          </button>

          {commentMessage && <p className="form-success">{commentMessage}</p>}
        </form>

        <div className="panel">
          <h2>Komentari korisnika</h2>

          <div className="comment-list">
            {(trail.comments || []).length > 0 ? (
              trail.comments.map((comment) => (
                <article key={comment.id} className="comment-card">
                  <div className="comment-head">
                    <strong>{comment.username}</strong>
                    <span>
                      {new Date(comment.created_at).toLocaleDateString("sr-RS")}
                    </span>
                  </div>
                  <p>{comment.comment_text}</p>

                  {comment.images?.length > 0 && (
                    <div className="comment-gallery">
                      {comment.images.map((image) => (
                        <img
                          key={image.id}
                          src={resolveAssetUrl(image.image_url)}
                          alt="Komentar"
                          className="comment-image"
                        />
                      ))}
                    </div>
                  )}
                </article>
              ))
            ) : (
              <p>Jos nema komentara za ovu stazu.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
