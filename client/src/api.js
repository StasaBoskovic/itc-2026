import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const ASSET_URL =
  import.meta.env.VITE_ASSET_URL || API_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_URL,
});

export function authConfig(token) {
  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};
}

export function resolveAssetUrl(source) {
  if (!source) {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%2329543a'/%3E%3Cstop offset='1' stop-color='%23d8b37a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='800' fill='url(%23g)'/%3E%3Cpath d='M0 560 L240 370 L415 510 L650 260 L905 520 L1200 280 L1200 800 L0 800 Z' fill='%23f2ecdd' fill-opacity='0.72'/%3E%3Ctext x='70' y='130' font-family='Verdana' font-size='64' fill='white'%3EMonTrails%3C/text%3E%3Ctext x='70' y='200' font-family='Verdana' font-size='28' fill='white'%3EPlaninarska i pjesacka staza%3C/text%3E%3C/svg%3E";
  }

  if (source.startsWith("http")) {
    return source;
  }

  return `${ASSET_URL}${source}`;
}
