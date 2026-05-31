import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const uploadsRoot = path.resolve(currentDirectory, "../../uploads");

function ensureFolder(folderName) {
  const absoluteFolder = path.join(uploadsRoot, folderName);
  fs.mkdirSync(absoluteFolder, { recursive: true });
  return absoluteFolder;
}

function normalizeFileName(originalName) {
  const extension = path.extname(originalName);
  const baseName = path
    .basename(originalName, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${Date.now()}-${baseName || "image"}${extension}`;
}

function buildUpload(folderName, limit) {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, callback) => {
        callback(null, ensureFolder(folderName));
      },
      filename: (_req, file, callback) => {
        callback(null, normalizeFileName(file.originalname));
      },
    }),
    fileFilter: (_req, file, callback) => {
      if (!file.mimetype.startsWith("image/")) {
        return callback(new Error("Dozvoljene su samo slike."));
      }

      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }).array("images", limit);
}

export const trailGalleryUpload = buildUpload("trails", 10);
export const commentImagesUpload = buildUpload("comments", 5);
