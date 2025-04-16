import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { createContainer } from "./container";
import { createMediaRouter } from "./routes/media.routes";

dotenv.config();

export async function initializeApp() {
  try {
    // Create DI container
    const container = createContainer();

    // Create Express app
    const app = express();
    app.use(cors());

    // Set up media routes
    const mediaRouter = createMediaRouter(container.mediaController);
    app.use("/media", mediaRouter);

    // Ensure bucket exists
    await container.storageService.ensureBucketExists(
      container.config.bucketName
    );

    return { app, container };
  } catch (error) {
    console.error("Failed to initialize application:", error);
    throw error;
  }
}
