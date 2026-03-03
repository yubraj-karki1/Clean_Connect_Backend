import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// ------------------ ENSURE DIRECTORY EXISTS ------------------
const uploadDir = path.join(process.cwd(), "uploads", "profile");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ------------------ STORAGE CONFIG ------------------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// ------------------ FILE FILTER ------------------
const fileFilter: multer.Options["fileFilter"] = (
  _req: Request,
  file,
  cb
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/avif",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "profile"));
  }
};

// ------------------ EXPORT UPLOAD ------------------
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
