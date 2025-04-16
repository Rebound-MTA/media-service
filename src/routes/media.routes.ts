// File: src/routes/media-routes.ts
import express from "express";
import multer from "multer";
import { MediaController } from "../controllers/media.controller";

export function createMediaRouter(
  mediaController: MediaController
): express.Router {
  const router = express.Router();

  // Set up multer for file upload handling
  const upload = multer({
    dest: "uploads/",
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
    fileFilter: (_req, file, cb) => {
      // Only accept image files
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    },
  });

  // Define routes
  router.post("/upload", upload.single("image"), (req, res) =>
    mediaController.uploadImage(req, res)
  );
  router.get("/:imageId", (req, res) => mediaController.getImage(req, res));
  router.delete("/:imageId", (req, res) =>
    mediaController.deleteImage(req, res)
  );
  router.get("/:imageId/thumbnail", (req, res) =>
    mediaController.getThumbnail(req, res)
  );

  return router;
}
