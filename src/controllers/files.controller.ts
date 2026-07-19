import { Request, Response } from "express";
import { nanoid } from "nanoid";
import path from "path";
import { config } from "../config";
import { storageProvider } from "../storage";
import {
  createFileRecord,
  deleteFileRecord,
  getFileById,
  incrementDownloadCount,
  listFilesByOwner,
} from "../services/file.service";
import { formatBytes, formatDate } from "../utils/format";

export function showLanding(req: Request, res: Response): void {
  res.render("index", {
    title: "Upload a file",
    user: req.user,
    appName: config.appName,
    allowAnonymous: config.allowAnonymousUploads,
  });
}

export async function handleUpload(req: Request, res: Response): Promise<void> {
  if (!req.user && !config.allowAnonymousUploads) {
    res.status(401).render("error", {
      title: "Sign in required",
      message: "You need an account to upload files.",
      user: req.user,
    });
    return;
  }

  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    res.status(400).render("error", {
      title: "Upload failed",
      message: "No file was received.",
      user: req.user,
    });
    return;
  }

  const storageKey = config.storageDriver === "local" ? file.filename : (file as any).key;
  const record = createFileRecord({
    ownerId: req.user?.sub ?? null,
    originalName: file.originalname,
    storageKey,
    size: file.size,
    mimeType: file.mimetype || "application/octet-stream",
  });

  res.redirect(`/f/${record.id}`);
}

function isPrivateHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".local")) return true;
  const parts = lower.split(".");
  if (parts.length === 4 && parts.every((part) => /^\d+$/.test(part))) {
    const [a, b] = parts.map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

export async function handleRemoteUpload(req: Request, res: Response): Promise<void> {
  if (!req.user && !config.allowAnonymousUploads) {
    res.status(401).render("error", {
      title: "Sign in required",
      message: "You need an account to upload files.",
      user: req.user,
    });
    return;
  }

  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).render("error", { title: "Remote upload failed", message: "A URL is required.", user: req.user });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).render("error", { title: "Remote upload failed", message: "That URL is not valid.", user: req.user });
    return;
  }

  if (!["http:", "https:"].includes(parsed.protocol) || isPrivateHostname(parsed.hostname)) {
    res.status(400).render("error", { title: "Remote upload failed", message: "That URL cannot be fetched.", user: req.user });
    return;
  }

  const response = await fetch(parsed.toString());
  if (!response.ok || !response.body) {
    res.status(400).render("error", { title: "Remote upload failed", message: `The remote server responded with ${response.status}.`, user: req.user });
    return;
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength && contentLength > config.maxUploadSizeBytes) {
    res.status(400).render("error", { title: "Remote upload failed", message: "The remote file exceeds the upload size limit.", user: req.user });
    return;
  }

  const originalName = decodeURIComponent(path.basename(parsed.pathname)) || "download";
  const mimeType = response.headers.get("content-type") ?? "application/octet-stream";
  const key = `${nanoid(24)}${path.extname(originalName)}`;
  const nodeStream = require("stream").Readable.fromWeb(response.body as any);

  const size = await storageProvider.saveFromStream(key, nodeStream, mimeType);

  const record = createFileRecord({
    ownerId: req.user?.sub ?? null,
    originalName,
    storageKey: key,
    size,
    mimeType,
  });
  res.redirect(`/f/${record.id}`);
}

export function showFilePage(req: Request, res: Response): void {
  const file = getFileById(req.params.id);
  if (!file) {
    res.status(404).render("error", { title: "File not found", message: "This file does not exist or was removed.", user: req.user });
    return;
  }

  res.render("file", {
    title: file.original_name,
    user: req.user,
    file,
    sizeLabel: formatBytes(file.size),
    dateLabel: formatDate(file.created_at),
    appName: config.appName,
  });
}

export async function downloadFile(req: Request, res: Response): Promise<void> {
  const file = getFileById(req.params.id);
  if (!file) {
    res.status(404).render("error", { title: "File not found", message: "This file does not exist or was removed.", user: req.user });
    return;
  }

  incrementDownloadCount(file.id);

  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.original_name)}"`);
  res.setHeader("Content-Type", file.mime_type);
  res.setHeader("Content-Length", file.size.toString());

  const stream = await storageProvider.getReadStream(file.storage_key);
  stream.on("error", () => {
    res.status(500).end();
  });
  stream.pipe(res);
}

export function showDashboard(req: Request, res: Response): void {
  const files = listFilesByOwner(req.user!.sub);
  res.render("dashboard", {
    title: "My files",
    user: req.user,
    files: files.map((f) => ({
      ...f,
      sizeLabel: formatBytes(f.size),
      dateLabel: formatDate(f.created_at),
    })),
  });
}

export async function deleteOwnFile(req: Request, res: Response): Promise<void> {
  const file = getFileById(req.params.id);
  if (!file || file.owner_id !== req.user!.sub) {
    res.status(404).render("error", { title: "File not found", message: "This file does not exist.", user: req.user });
    return;
  }

  await storageProvider.delete(file.storage_key);
  deleteFileRecord(file.id);
  res.redirect("/dashboard");
}
