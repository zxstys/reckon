import { Readable } from "stream";
import { StorageEngine } from "multer";

export interface StoredObjectInfo {
  key: string;
  size: number;
}

export interface StorageProvider {
  driverName: string;
  createMulterEngine(): StorageEngine;
  saveFromStream(key: string, stream: Readable, contentType: string): Promise<number>;
  getReadStream(key: string, range?: { start: number; end?: number }): Promise<Readable>;
  getSize(key: string): Promise<number>;
  delete(key: string): Promise<void>;
  getDirectUrl(key: string): Promise<string | null>;
}
