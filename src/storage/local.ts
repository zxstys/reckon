import fs from "fs";
import path from "path";
import { Readable } from "stream";
import multer, { StorageEngine } from "multer";
import { nanoid } from "nanoid";
import { config } from "../config";
import { StorageProvider } from "./types";

fs.mkdirSync(config.local.storagePath, { recursive: true });

function keyToPath(key: string): string {
  return path.join(config.local.storagePath, key);
}

export class LocalStorageProvider implements StorageProvider {
  driverName = "local";

  createMulterEngine(): StorageEngine {
    return multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, config.local.storagePath);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${nanoid(24)}${ext}`);
      },
    });
  }

  async saveFromStream(key: string, stream: Readable, _contentType: string): Promise<number> {
    const filePath = keyToPath(key);
    const { pipeline } = await import("stream/promises");
    await pipeline(stream, fs.createWriteStream(filePath));
    const stat = await fs.promises.stat(filePath);
    return stat.size;
  }

  async getReadStream(key: string, range?: { start: number; end?: number }): Promise<Readable> {
    const filePath = keyToPath(key);
    if (range) {
      return fs.createReadStream(filePath, { start: range.start, end: range.end });
    }
    return fs.createReadStream(filePath);
  }

  async getSize(key: string): Promise<number> {
    const stat = await fs.promises.stat(keyToPath(key));
    return stat.size;
  }

  async delete(key: string): Promise<void> {
    const filePath = keyToPath(key);
    await fs.promises.rm(filePath, { force: true });
  }

  async getDirectUrl(): Promise<string | null> {
    return null;
  }
}
