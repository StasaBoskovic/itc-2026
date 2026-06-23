import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import metaRoutes from "./routes/metaRoutes.js";
import trailRoutes from "./routes/trailRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const uploadsDirectory = path.resolve(currentDirectory, "../uploads");
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : "*";

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDirectory));

app.get("/api/health", (_req, res) => {
  res.json({ message: "MonTrails API radi." });
});

app.use("/api/auth", authRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/trails", trailRoutes);
app.use("/api/users", userRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);

  res.status(500).json({
    message: error.message || "Doslo je do greske na serveru.",
  });
});

export default app;
