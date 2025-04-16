// File: src/container.ts
import * as Minio from "minio";
import { StorageService } from "./types";
import { MinioStorageService } from "./services/minio";
import { MediaController } from "./controllers/media.controller";
import { Config } from "./types";

export interface Container {
  storageService: StorageService;
  mediaController: MediaController;
  config: Config;
}

export function createContainer(): Container {
  // Load configuration
  const config: Config = {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    bucketName: process.env.MINIO_BUCKET || "images",
  };

  // Create MinIO client
  const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000"),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "",
    secretKey: process.env.MINIO_SECRET_KEY || "",
  });

  // Create storage service
  const storageService = new MinioStorageService(minioClient);

  // Create media controller
  const mediaController = new MediaController(
    storageService,
    config.bucketName
  );

  return {
    storageService,
    mediaController,
    config,
  };
}
