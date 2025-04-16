// File: src/services/minio-service.ts
import * as Minio from "minio";
import { StorageService } from "../types";

export class MinioStorageService implements StorageService {
  private client: Minio.Client;

  constructor(client: Minio.Client) {
    this.client = client;
  }

  async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      const exists = await this.client.bucketExists(bucketName);
      if (!exists) {
        await this.client.makeBucket(bucketName);
        console.log(`Bucket '${bucketName}' created successfully`);
      }
    } catch (err) {
      console.error("Error creating bucket:", err);
      throw err;
    }
  }

  async uploadFile(
    bucketName: string,
    objectName: string,
    filePath: string,
    metaData: any
  ): Promise<void> {
    await this.client.fPutObject(bucketName, objectName, filePath, metaData);
  }

  async getObject(
    bucketName: string,
    objectName: string
  ): Promise<Minio.BucketStream<Buffer>> {
    return this.client.getObject(bucketName, objectName);
  }

  async statObject(
    bucketName: string,
    objectName: string
  ): Promise<Minio.BucketItemStat> {
    return this.client.statObject(bucketName, objectName);
  }

  async removeObject(bucketName: string, objectName: string): Promise<void> {
    await this.client.removeObject(bucketName, objectName);
  }

  listObjects(
    bucketName: string,
    prefix: string
  ): AsyncIterable<Minio.BucketItem> {
    return this.client.listObjectsV2(bucketName, prefix);
  }
}
