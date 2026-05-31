import { Link } from "react-router-dom";

import { resolveAssetUrl } from "../api";
import StarRating from "./StarRating";

export default function TrailCard({ trail }) {
  return (
    <article className="trail-card">
      <img
        src={resolveAssetUrl(trail.cover_image)}
        alt={trail.name}
        className="trail-card-image"
      />

      <div className="trail-card-body">
        <div className="trail-card-topline">
          <span className="tag">{trail.city}</span>
          <span className="tag tag-soft">{trail.difficulty}</span>
        </div>

        <h3>{trail.name}</h3>
        <p>{trail.description || "Staza je spremna za nove planinare i setace."}</p>

        <div className="trail-card-meta">
          <span>{trail.length_km} km</span>
          <span>{trail.elevation_gain} m uspona</span>
          <span>Vrh {trail.highest_point} m</span>
        </div>

        <div className="trail-card-footer">
          <div>
            <StarRating value={Number(trail.average_rating || 0)} readOnly />
            <small>{Number(trail.average_rating || 0).toFixed(1)} / 5</small>
          </div>

          <Link to={`/trails/${trail.id}`} className="primary-link">
            Detalji
          </Link>
        </div>
      </div>
    </article>
  );
}

