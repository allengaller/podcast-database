import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs-extra';

export class StorageService {
  private static s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    },
    forcePathStyle: true,
  });

  private static BUCKET = process.env.S3_BUCKET || 'leetcast';

  static async uploadFile(localPath: string, key: string, contentType?: string): Promise<string> {
    const body = await fs.readFile(localPath);
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType || 'audio/mpeg',
      })
    );
    return `${process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT}/${this.BUCKET}/${key}`;
  }

  static async uploadBuffer(buffer: Buffer, key: string, contentType?: string): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'audio/mpeg',
      })
    );
    return `${process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT}/${this.BUCKET}/${key}`;
  }

  static async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.BUCKET,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }
}
