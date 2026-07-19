import { nanoid } from "nanoid";
import { db } from "../db";
import { FileRecord } from "../types";
import { config } from "../config";

export interface CreateFileInput {
  ownerId: string | null;
  originalName: string;
  storageKey: string;
  size: number;
  mimeType: string;
}

export function createFileRecord(input: CreateFileInput): FileRecord {
  const id = nanoid(10);
  db.prepare(
    `INSERT INTO files (id, owner_id, original_name, storage_key, size, mime_type, storage_driver)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.ownerId,
    input.originalName,
    input.storageKey,
    input.size,
    input.mimeType,
    config.storageDriver
  );
  return getFileById(id) as FileRecord;
}

export function getFileById(id: string): FileRecord | undefined {
  return db.prepare("SELECT * FROM files WHERE id = ?").get(id) as FileRecord | undefined;
}

export function listFilesByOwner(ownerId: string): FileRecord[] {
  return db
    .prepare("SELECT * FROM files WHERE owner_id = ? ORDER BY created_at DESC")
    .all(ownerId) as FileRecord[];
}

export function listAllFiles(): FileRecord[] {
  return db.prepare("SELECT * FROM files ORDER BY created_at DESC").all() as FileRecord[];
}

export function incrementDownloadCount(id: string): void {
  db.prepare("UPDATE files SET download_count = download_count + 1 WHERE id = ?").run(id);
}

export function deleteFileRecord(id: string): void {
  db.prepare("DELETE FROM files WHERE id = ?").run(id);
}

export function countFiles(): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM files").get() as { count: number };
  return row.count;
}

export function sumStorageUsed(): number {
  const row = db.prepare("SELECT COALESCE(SUM(size), 0) as total FROM files").get() as {
    total: number;
  };
  return row.total;
}
