import express from "express";
import request from "supertest";
import fs from "fs";
import path from "path";
import { createMediaRouter } from "./media.routes";
import { MediaController } from "../controllers/media.controller";

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

describe("createMediaRouter", () => {
  let mediaController: jest.Mocked<MediaController>;
  let app: express.Application;

  beforeEach(() => {
    // Mock MediaController methods
    mediaController = {
      uploadImage: jest.fn((req, res) =>
        res.status(200).send("Image uploaded")
      ),
      getImage: jest.fn((req, res) => res.status(200).send("Image fetched")),
      deleteImage: jest.fn((req, res) => res.status(200).send("Image deleted")),
      getThumbnail: jest.fn((req, res) =>
        res.status(200).send("Thumbnail fetched")
      ),
    } as unknown as jest.Mocked<MediaController>;

    // Create an Express app with the router
    app = express();
    app.use(express.json());
    app.use("/media", createMediaRouter(mediaController));
  });

  afterEach(() => {
    // Clean up the uploads directory after each test
    if (fs.existsSync(UPLOADS_DIR)) {
      fs.readdirSync(UPLOADS_DIR).forEach((file) => {
        fs.unlinkSync(path.join(UPLOADS_DIR, file));
      });
    }
  });

  test("POST /media/upload should call uploadImage", async () => {
    const response = await request(app)
      .post("/media/upload")
      .attach("image", Buffer.from("test"), {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });

    expect(mediaController.uploadImage).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.text).toBe("Image uploaded");
  });

  test("GET /media/:imageId should call getImage", async () => {
    const response = await request(app).get("/media/123");

    expect(mediaController.getImage).toHaveBeenCalledWith(
      expect.objectContaining({ params: { imageId: "123" } }),
      expect.anything()
    );
    expect(response.status).toBe(200);
    expect(response.text).toBe("Image fetched");
  });

  test("DELETE /media/:imageId should call deleteImage", async () => {
    const response = await request(app).delete("/media/123");

    expect(mediaController.deleteImage).toHaveBeenCalledWith(
      expect.objectContaining({ params: { imageId: "123" } }),
      expect.anything()
    );
    expect(response.status).toBe(200);
    expect(response.text).toBe("Image deleted");
  });

  test("GET /media/:imageId/thumbnail should call getThumbnail", async () => {
    const response = await request(app).get("/media/123/thumbnail");

    expect(mediaController.getThumbnail).toHaveBeenCalledWith(
      expect.objectContaining({ params: { imageId: "123" } }),
      expect.anything()
    );
    expect(response.status).toBe(200);
    expect(response.text).toBe("Thumbnail fetched");
  });

  test("POST /media/upload should reject non-image files", async () => {
    const response = await request(app)
      .post("/media/upload")
      .attach("image", Buffer.from("test"), {
        filename: "test.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(500); // Multer should throw an error
    expect(response.text).toContain("Only image files are allowed");
  });
});
