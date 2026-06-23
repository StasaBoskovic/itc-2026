export const MAP_VIEWBOX_WIDTH = 1000;
export const MAP_VIEWBOX_HEIGHT = 700;
export const MIN_ROUTE_ZOOM = 1;
export const MAX_ROUTE_ZOOM = 3.2;

function normalizePoint(point) {
  const x = Number(point?.x);
  const y = Number(point?.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return {
    x: Math.min(MAP_VIEWBOX_WIDTH, Math.max(0, Number(x.toFixed(2)))),
    y: Math.min(MAP_VIEWBOX_HEIGHT, Math.max(0, Number(y.toFixed(2)))),
  };
}

export function normalizeRouteMap(value) {
  if (!value) {
    return {
      version: 1,
      strokes: [],
    };
  }

  let parsed = value;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch (_error) {
      return {
        version: 1,
        strokes: [],
      };
    }
  }

  const strokes = Array.isArray(parsed?.strokes)
    ? parsed.strokes
        .map((stroke) => {
          const points = Array.isArray(stroke?.points)
            ? stroke.points.map(normalizePoint).filter(Boolean)
            : [];

          if (points.length < 2) {
            return null;
          }

          return { points };
        })
        .filter(Boolean)
    : [];

  return {
    version: 1,
    strokes,
  };
}

export function hasRouteMap(value) {
  return normalizeRouteMap(value).strokes.length > 0;
}

export function buildRoutePath(points) {
  if (!points?.length) {
    return "";
  }

  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");
}

export function getRouteEndpoints(value) {
  const routeMap = normalizeRouteMap(value);
  const firstStroke = routeMap.strokes[0];
  const lastStroke = routeMap.strokes[routeMap.strokes.length - 1];

  if (!firstStroke || !lastStroke) {
    return {
      startPoint: null,
      endPoint: null,
    };
  }

  return {
    startPoint: firstStroke.points[0] || null,
    endPoint: lastStroke.points[lastStroke.points.length - 1] || null,
  };
}
