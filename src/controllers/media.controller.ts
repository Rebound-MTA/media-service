// File: src/controllers/media-controller.ts
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { StorageService, CustomRequest, FileUploadResponse } from "../types";

export class MediaController {
  private storageService: StorageService;
  private bucketName: string;

  constructor(storageService: StorageService, bucketName: string) {
    this.storageService = storageService;
    this.bucketName = bucketName;
  }

  async uploadImage(req: CustomRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      const file = req.file;
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const objectName = `${fileId}${fileExtension}`;

      // Upload file to storage
      await this.storageService.uploadFile(
        this.bucketName,
        objectName,
        file.path,
        { "Content-Type": file.mimetype }
      );

      // Generate and upload thumbnail
      const thumbnailPath = `${file.path}_thumb`;
      await sharp(file.path)
        .resize(200, 200, { fit: "inside" })
        .toFile(thumbnailPath);

      const thumbnailObjectName = `thumbnails/${fileId}${fileExtension}`;
      await this.storageService.uploadFile(
        this.bucketName,
        thumbnailObjectName,
        thumbnailPath,
        { "Content-Type": file.mimetype }
      );

      // Clean up local files
      fs.unlinkSync(file.path);
      fs.unlinkSync(thumbnailPath);

      // Return the image ID with extension to the client
      const response: FileUploadResponse = {
        imageId: `${fileId}${fileExtension}`, // Include extension in the ID
        originalName: file.originalname,
        contentType: file.mimetype,
        size: file.size,
      };

      res.status(201).json(response);
    } catch (err) {
      console.error("Error uploading file:", err);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }

  async getImage(req: Request, res: Response): Promise<void> {
    try {
      const imageId = req.params.imageId; // Now includes extension

      try {
        // Direct access to the object using the full ID (with extension)
        const dataStream = await this.storageService.getObject(
          this.bucketName,
          imageId
        );

        const stat = await this.storageService.statObject(
          this.bucketName,
          imageId
        );
        const contentType =
          stat.metaData["content-type"] || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Length", stat.size);

        dataStream.pipe(res);
      } catch (error) {
        console.error(`Error retrieving object: ${imageId}`, error);
        res.status(404).json({ error: "Image not found" });
      }
    } catch (err) {
      console.error("Error retrieving image:", err);
      res.status(500).json({ error: "Failed to retrieve image" });
    }
  }

  async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const imageId = req.params.imageId; // Now includes extension

      try {
        // Delete the original image
        await this.storageService.removeObject(this.bucketName, imageId);

        // Also delete the thumbnail
        // Extract base ID and extension to construct thumbnail path
        const extension = path.extname(imageId);
        const baseId = path.basename(imageId, extension);
        const thumbnailObjectName = `thumbnails/${baseId}${extension}`;

        try {
          await this.storageService.removeObject(
            this.bucketName,
            thumbnailObjectName
          );
        } catch (error) {
          console.log(
            `Thumbnail not found for deletion: ${thumbnailObjectName}`
          );
        }

        res.status(200).json({ message: "Image deleted successfully" });
      } catch (error) {
        console.error(`Error deleting object: ${imageId}`, error);
        res.status(404).json({ error: "Image not found" });
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      res.status(500).json({ error: "Failed to delete image" });
    }
  }

  async getThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const imageId = req.params.imageId; // Now includes extension

      // Extract base ID and extension to construct thumbnail path
      const extension = path.extname(imageId);
      const baseId = path.basename(imageId, extension);
      const thumbnailObjectName = `thumbnails/${baseId}${extension}`;

      try {
        // Direct access to the thumbnail object
        const dataStream = await this.storageService.getObject(
          this.bucketName,
          thumbnailObjectName
        );

        const stat = await this.storageService.statObject(
          this.bucketName,
          thumbnailObjectName
        );
        const contentType =
          stat.metaData["content-type"] || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Length", stat.size);

        dataStream.pipe(res);
      } catch (error) {
        console.error(
          `Error retrieving thumbnail: ${thumbnailObjectName}`,
          error
        );
        res.status(404).json({ error: "Thumbnail not found" });
      }
    } catch (err) {
      console.error("Error retrieving thumbnail:", err);
      res.status(500).json({ error: "Failed to retrieve thumbnail" });
    }
  }
}
