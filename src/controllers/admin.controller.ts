import { Request, Response } from "express";
import { config } from "../config";
import { storageProvider } from "../storage";
import {
  countUsers,
  deleteUser,
  listUsers,
  setUserBanned,
} from "../services/user.service";
import {
  countFiles,
  deleteFileRecord,
  getFileById,
  listAllFiles,
  sumStorageUsed,
} from "../services/file.service";
import { formatBytes, formatDate } from "../utils/format";

export function showAdminDashboard(req: Request, res: Response): void {
  res.render("admin/dashboard", {
    title: "Admin overview",
    user: req.user,
    stats: {
      userCount: countUsers(),
      fileCount: countFiles(),
      storageUsedLabel: formatBytes(sumStorageUsed()),
      storageDriver: config.storageDriver,
    },
  });
}

export function showAdminUsers(req: Request, res: Response): void {
  const users = listUsers().map((u) => ({ ...u, dateLabel: formatDate(u.created_at) }));
  res.render("admin/users", { title: "Manage users", user: req.user, users });
}

export function banUser(req: Request, res: Response): void {
  setUserBanned(req.params.id, true);
  res.redirect("/admin/users");
}

export function unbanUser(req: Request, res: Response): void {
  setUserBanned(req.params.id, false);
  res.redirect("/admin/users");
}

export function removeUser(req: Request, res: Response): void {
  if (req.params.id === req.user!.sub) {
    res.status(400).render("error", { title: "Action not allowed", message: "You cannot delete your own account here.", user: req.user });
    return;
  }
  deleteUser(req.params.id);
  res.redirect("/admin/users");
}

export function showAdminFiles(req: Request, res: Response): void {
  const files = listAllFiles().map((f) => ({
    ...f,
    sizeLabel: formatBytes(f.size),
    dateLabel: formatDate(f.created_at),
  }));
  res.render("admin/files", { title: "Manage files", user: req.user, files });
}

export async function removeFile(req: Request, res: Response): Promise<void> {
  const file = getFileById(req.params.id);
  if (!file) {
    res.redirect("/admin/files");
    return;
  }
  await storageProvider.delete(file.storage_key);
  deleteFileRecord(file.id);
  res.redirect("/admin/files");
}
