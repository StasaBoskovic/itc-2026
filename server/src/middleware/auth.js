import jwt from "jsonwebtoken";

function extractToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1];
}

export function attachUserIfPresent(req, _res, next) {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_error) {
    req.user = null;
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Moras biti prijavljen." });
  }

  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Samo admin moze da koristi ovu opciju." });
  }

  next();
}

