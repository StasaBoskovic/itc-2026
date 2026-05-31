import express from "express";

import { query } from "../db.js";

const router = express.Router();

router.get("/difficulties", async (_req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, name FROM difficulty_levels ORDER BY id"
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/ecological-statuses", async (_req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, status_name FROM ecological_statuses ORDER BY id"
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/terrain-types", async (_req, res, next) => {
  try {
    const { rows } = await query("SELECT id, name FROM terrain_types ORDER BY id");
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

export default router;

