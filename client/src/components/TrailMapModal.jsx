import { useEffect } from "react";

import TrailRouteMap from "./TrailRouteMap";
import { hasRouteMap } from "../utils/trailMap";

export default function TrailMapModal({
  open,
  onClose,
  routeMap,
  trailName,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !hasRouteMap(routeMap)) {
    return null;
  }

  return (
    <div
      className="map-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="map-modal-panel panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Mapa staze ${trailName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="map-modal-header">
          <div>
            <span className="eyebrow">Mapa</span>
            <h2>{trailName}</h2>
            <p>Otvori, uvecaj i pregledaj putanju koju je admin skicirao.</p>
          </div>

          <button
            type="button"
            className="secondary-button route-map-action-button"
            onClick={onClose}
          >
            Zatvori
          </button>
        </div>

        <TrailRouteMap
          value={routeMap}
          title="Skica staze"
          description="Koristi zoom kontrole i skrol da pregledas detalje rute."
          emptyMessage="Za ovu stazu jos nije dodata skica rute."
        />
      </div>
    </div>
  );
}
