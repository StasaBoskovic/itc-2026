import { useId, useRef, useState } from "react";

import {
  MAX_ROUTE_ZOOM,
  MIN_ROUTE_ZOOM,
  buildRoutePath,
  getRouteEndpoints,
  normalizeRouteMap,
} from "../utils/trailMap";

const MAP_SHAPE_PATH =
  "M122 418 L168 293 L250 223 L386 170 L512 145 L642 170 L756 158 L849 213 L891 301 L863 397 L781 468 L731 548 L630 580 L543 540 L462 567 L366 545 L279 515 L187 478 Z";

function clampZoom(value) {
  return Math.min(MAX_ROUTE_ZOOM, Math.max(MIN_ROUTE_ZOOM, Number(value) || 1));
}

function getDistance(pointA, pointB) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

function getDisplayedRoute(routeMap, draftPoints) {
  if (draftPoints.length < 2) {
    return routeMap;
  }

  return {
    ...routeMap,
    strokes: [...routeMap.strokes, { points: draftPoints }],
  };
}

export default function TrailRouteMap({
  value,
  onChange,
  editable = false,
  showToolbar = true,
  title = "Skica rute",
  description = "",
  helperText = "",
  emptyMessage = "Ruta jos nije nacrtana.",
}) {
  const gradientId = `route-map-gradient-${useId().replace(/:/g, "")}`;
  const linesId = `route-map-lines-${useId().replace(/:/g, "")}`;
  const glowId = `route-map-glow-${useId().replace(/:/g, "")}`;
  const svgRef = useRef(null);
  const activePointerIdRef = useRef(null);
  const draftPointsRef = useRef([]);
  const [zoom, setZoom] = useState(1);
  const [draftPoints, setDraftPoints] = useState([]);
  const routeMap = normalizeRouteMap(value);
  const displayedRoute = getDisplayedRoute(routeMap, draftPoints);
  const { startPoint, endPoint } = getRouteEndpoints(displayedRoute);
  const canEdit = editable && typeof onChange === "function";
  const hasSavedRoute = routeMap.strokes.length > 0;

  function updateRoute(nextStrokes) {
    onChange?.({
      version: 1,
      strokes: nextStrokes,
    });
  }

  function getSvgPoint(event) {
    if (!svgRef.current) {
      return null;
    }

    const bounds = svgRef.current.getBoundingClientRect();

    if (!bounds.width || !bounds.height) {
      return null;
    }

    return {
      x: ((event.clientX - bounds.left) / bounds.width) * 1000,
      y: ((event.clientY - bounds.top) / bounds.height) * 700,
    };
  }

  function resetDraft() {
    activePointerIdRef.current = null;
    draftPointsRef.current = [];
    setDraftPoints([]);
  }

  function finalizeDraft(event) {
    if (!canEdit || activePointerIdRef.current !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const nextDraftPoints = [...draftPointsRef.current];

    if (nextDraftPoints.length >= 2) {
      updateRoute([...routeMap.strokes, { points: nextDraftPoints }]);
    }

    resetDraft();
  }

  function handlePointerDown(event) {
    if (!canEdit) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const nextPoint = getSvgPoint(event);

    if (!nextPoint) {
      return;
    }

    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    draftPointsRef.current = [nextPoint];
    setDraftPoints([nextPoint]);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!canEdit || activePointerIdRef.current !== event.pointerId) {
      return;
    }

    const nextPoint = getSvgPoint(event);

    if (!nextPoint) {
      return;
    }

    const lastPoint = draftPointsRef.current[draftPointsRef.current.length - 1];

    if (lastPoint && getDistance(lastPoint, nextPoint) < 6) {
      return;
    }

    const nextDraft = [...draftPointsRef.current, nextPoint];
    draftPointsRef.current = nextDraft;
    setDraftPoints(nextDraft);
  }

  function handleUndo() {
    if (!routeMap.strokes.length) {
      return;
    }

    updateRoute(routeMap.strokes.slice(0, -1));
  }

  function handleClear() {
    updateRoute([]);
    resetDraft();
  }

  return (
    <div className="route-map">
      {showToolbar && (
        <div className="route-map-toolbar">
          <div className="route-map-toolbar-copy">
            <strong>{title}</strong>
            {description && <span>{description}</span>}
          </div>

          <div className="route-map-actions">
            <span className="route-map-zoom-pill">
              Zoom {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="secondary-button route-map-action-button"
              onClick={() => setZoom((current) => clampZoom(current - 0.2))}
              disabled={zoom <= MIN_ROUTE_ZOOM}
            >
              Umanji
            </button>
            <button
              type="button"
              className="secondary-button route-map-action-button"
              onClick={() => setZoom((current) => clampZoom(current + 0.2))}
              disabled={zoom >= MAX_ROUTE_ZOOM}
            >
              Uvecaj
            </button>
            {canEdit && (
              <>
                <button
                  type="button"
                  className="secondary-button route-map-action-button"
                  onClick={handleUndo}
                  disabled={!hasSavedRoute}
                >
                  Vrati potez
                </button>
                <button
                  type="button"
                  className="secondary-button route-map-action-button"
                  onClick={handleClear}
                  disabled={!hasSavedRoute && draftPoints.length === 0}
                >
                  Obrisi skicu
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="route-map-scroll">
        <svg
          ref={svgRef}
          viewBox="0 0 1000 700"
          className={`route-map-surface ${canEdit ? "route-map-surface-editable" : ""}`}
          style={{ width: `${Math.max(zoom, 1) * 100}%` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finalizeDraft}
          onPointerCancel={finalizeDraft}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#dfeaa2" />
              <stop offset="42%" stopColor="#7fb95c" />
              <stop offset="100%" stopColor="#1f5d36" />
            </linearGradient>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id={linesId}>
              <path d={MAP_SHAPE_PATH} />
            </clipPath>
          </defs>

          <rect width="1000" height="700" fill="#09140d" />
          <path
            d={MAP_SHAPE_PATH}
            fill={`url(#${gradientId})`}
            stroke="rgba(240, 251, 228, 0.66)"
            strokeWidth="10"
            strokeLinejoin="round"
          />

          <g clipPath={`url(#${linesId})`} opacity="0.45">
            <path
              d="M90 228 C242 264, 332 204, 470 232 S748 283, 905 213"
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M126 314 C274 361, 392 282, 522 324 S736 380, 857 320"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M118 410 C272 446, 378 392, 514 438 S742 502, 874 425"
              fill="none"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d="M210 198 L318 520"
              stroke="rgba(14, 43, 26, 0.22)"
              strokeWidth="6"
            />
            <path
              d="M412 162 L470 565"
              stroke="rgba(14, 43, 26, 0.18)"
              strokeWidth="6"
            />
            <path
              d="M646 168 L694 560"
              stroke="rgba(14, 43, 26, 0.18)"
              strokeWidth="6"
            />
          </g>

          <g>
            {displayedRoute.strokes.map((stroke, index) => {
              const pathData = buildRoutePath(stroke.points);

              return (
                <g key={`${index}-${stroke.points.length}`}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke="rgba(18, 26, 17, 0.42)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#${glowId})`}
                  />
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#fff6c0"
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#f67342"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </g>

          {startPoint && (
            <g>
              <circle cx={startPoint.x} cy={startPoint.y} r="16" fill="#0f2b1a" />
              <circle cx={startPoint.x} cy={startPoint.y} r="11" fill="#9beb6f" />
            </g>
          )}

          {endPoint && (
            <g>
              <circle cx={endPoint.x} cy={endPoint.y} r="16" fill="#42170f" />
              <circle cx={endPoint.x} cy={endPoint.y} r="11" fill="#ff8a5c" />
            </g>
          )}

          <text
            x="70"
            y="94"
            fill="rgba(244, 252, 233, 0.9)"
            fontFamily="Cormorant Garamond, serif"
            fontSize="52"
            fontWeight="700"
            letterSpacing="1.5"
          >
            Crna Gora
          </text>
          <text
            x="72"
            y="126"
            fill="rgba(244, 252, 233, 0.72)"
            fontFamily="Manrope, sans-serif"
            fontSize="18"
          >
            Skica rute koju je dodao admin
          </text>
        </svg>
      </div>

      {!displayedRoute.strokes.length && (
        <p className="route-map-empty-note">{emptyMessage}</p>
      )}

      {helperText && <p className="route-map-helper">{helperText}</p>}
    </div>
  );
}
