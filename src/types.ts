// File: src/types.ts
import { Request } from "express";
import * as Minio from "minio";

export interface StorageService {
  ensureBucketExists(bucketName: string): Promise<void>;
  uploadFile(
    bucketName: string,
    objectName: string,
    filePath: string,
    metaData: any
  ): Promise<void>;
  getObject(
    bucketName: string,
    objectName: string
  ): Promise<Minio.BucketStream<Buffer>>;
  statObject(
    bucketName: string,
    objectName: string
  ): Promise<Minio.BucketItemStat>;
  removeObject(bucketName: string, objectName: string): Promise<void>;
  listObjects(
    bucketName: string,
    prefix: string
  ): AsyncIterable<Minio.BucketItem>;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export interface CustomRequest extends Omit<Request, "file"> {
  file?: MulterFile;
}

export interface FileUploadResponse {
  imageId: string;
  originalName: string;
  contentType: string;
  size: number;
}

export interface Config {
  port: number;
  bucketName: string;
}
