import { Request, Response } from "express";
import { MediaController } from "./media.controller";
import { StorageService } from "../types";
import sharp from "sharp";
import fs from "fs";

jest.mock("sharp");
jest.mock("fs");

describe("MediaController", () => {
  let storageService: jest.Mocked<StorageService>;
  let mediaController: MediaController;
  let mockResponse: jest.Mocked<Response>;

  beforeEach(() => {
    storageService = {
      uploadFile: jest.fn(),
      getObject: jest.fn(),
      statObject: jest.fn(),
      removeObject: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    mediaController = new MediaController(storageService, "test-bucket");

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    } as unknown as jest.Mocked<Response>;

    jest.clearAllMocks();
  });

  describe("uploadImage", () => {
    it("should return 400 if no file is provided", async () => {
      const mockRequest = { file: null } as unknown as Request;

      await mediaController.uploadImage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "No image file provided",
      });
    });

    it("should upload image and thumbnail successfully", async () => {
      const mockFile = {
        path: "test-path",
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        size: 1024,
      };
      const mockRequest = { file: mockFile } as unknown as Request;

      (sharp as unknown as jest.Mock).mockReturnValue({
        resize: jest.fn().mockReturnThis(),
        toFile: jest.fn().mockResolvedValue(undefined),
      });

      await mediaController.uploadImage(mockRequest, mockResponse);

      expect(storageService.uploadFile).toHaveBeenCalledTimes(2);
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          imageId: expect.any(String),
          originalName: "test.jpg",
          contentType: "image/jpeg",
          size: 1024,
        })
      );
    });

    it("should return 500 if an error occurs during upload", async () => {
      const mockFile = {
        path: "test-path",
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        size: 1024,
      };
      const mockRequest = { file: mockFile } as unknown as Request;

      storageService.uploadFile.mockRejectedValue(new Error("Upload failed"));

      await mediaController.uploadImage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to upload image",
      });
    });
  });

  describe("getImage", () => {
    it("should retrieve an image successfully", async () => {
      const mockRequest = {
        params: { imageId: "test.jpg" },
      } as unknown as Request;
      const mockDataStream = {
        pipe: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
        read: jest.fn(),
        readable: true,
        // Add minimal implementation of Stream interface
      } as any;
      storageService.getObject.mockResolvedValue(mockDataStream);
      storageService.statObject.mockResolvedValue({
        size: 1024,
        metaData: { "content-type": "image/jpeg" },
        etag: "test-etag",
        lastModified: new Date(),
      });

      await mediaController.getImage(mockRequest, mockResponse);

      expect(storageService.getObject).toHaveBeenCalledWith(
        "test-bucket",
        "test.jpg"
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "image/jpeg"
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Length",
        1024
      );
      expect(mockDataStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it("should return 404 if the image is not found", async () => {
      const mockRequest = {
        params: { imageId: "test.jpg" },
      } as unknown as Request;

      storageService.getObject.mockRejectedValue(new Error("Not found"));

      await mediaController.getImage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Image not found",
      });
    });
  });

  describe("deleteImage", () => {
    it("should delete an image and its thumbnail successfully", async () => {
      const mockRequest = {
        params: { imageId: "test.jpg" },
      } as unknown as Request;

      await mediaController.deleteImage(mockRequest, mockResponse);

      expect(storageService.removeObject).toHaveBeenCalledTimes(2);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Image deleted successfully",
      });
    });

    it("should return 404 if the image is not found", async () => {
      const mockRequest = {
        params: { imageId: "test.jpg" },
      } as unknown as Request;

      storageService.removeObject.mockRejectedValue(new Error("Not found"));

      await mediaController.deleteImage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Image not found",
      });
    });
  });

  describe("getThumbnail", () => {
    it("should retrieve a thumbnail successfully", async () => {
      const mockRequest = {
        params: { imageId: "test.jpg" },
      } as unknown as Request;
      const mockDataStream = {
        pipe: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
        read: jest.fn(),
        readable: true,
        // Add minimal implementation of Stream interface
      } as any;
      storageService.getObject.mockResolvedValue(mockDataStream);
      storageService.statObject.mockResolvedValue({
        size: 512,
        metaData: { "content-type": "image/jpeg" },
        etag: "test-etag",
        lastModified: new Date(),
      });

      await mediaController.getThumbnail(mockRequest, mockResponse);

      expect(storageService.getObject).toHaveBeenCalledWith(
        "test-bucket",
        "thumbnails/test.jpg"
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "image/jpeg"
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Length",
        512
      );
      expect(mockDataStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it("should return 404 if the thumbnail is not found", async () => {
      const mockRequest = {
        params: { imageId: "test.jpg" },
      } as unknown as Request;

      storageService.getObject.mockRejectedValue(new Error("Not found"));

      await mediaController.getThumbnail(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Thumbnail not found",
      });
    });
  });
});
