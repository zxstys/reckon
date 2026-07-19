import { Readable } from "stream";
import { StorageEngine } from "multer";
import multerS3 from "multer-s3";
import { nanoid } from "nanoid";
import path from "path";
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config";
import { StorageProvider } from "./types";

export class S3StorageProvider implements StorageProvider {
  driverName = "s3";
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: config.s3.region,
      endpoint: config.s3.endpoint,
      forcePathStyle: config.s3.forcePathStyle,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
    });
  }

  createMulterEngine(): StorageEngine {
    return multerS3({
      s3: this.client,
      bucket: config.s3.bucket,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${nanoid(24)}${ext}`);
      },
    });
  }

  async saveFromStream(key: string, stream: Readable, contentType: string): Promise<number> {
    const { Upload } = await import("@aws-sdk/lib-storage");
    const { Transform } = await import("stream");

    let total = 0;
    const counter = new Transform({
      transform(chunk, _enc, cb) {
        total += chunk.length;
        cb(null, chunk);
      },
    });

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: config.s3.bucket,
        Key: key,
        Body: stream.pipe(counter),
        ContentType: contentType,
      },
    });

    await upload.done();
    return total;
  }

  async getReadStream(key: string, range?: { start: number; end?: number }): Promise<Readable> {
    const rangeHeader = range ? `bytes=${range.start}-${range.end ?? ""}` : undefined;
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Range: rangeHeader,
      })
    );
    return result.Body as Readable;
  }

  async getSize(key: string): Promise<number> {
    const result = await this.client.send(
      new HeadObjectCommand({ Bucket: config.s3.bucket, Key: key })
    );
    return result.ContentLength ?? 0;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: key }));
  }

  async getDirectUrl(key: string): Promise<string | null> {
    if (config.s3.publicUrlBase) {
      return `${config.s3.publicUrlBase.replace(/\/$/, "")}/${key}`;
    }
    const command = new GetObjectCommand({ Bucket: config.s3.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: 3600 });
  }
}
