import { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { verifyToken } from "../utils/jwt";

export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[config.cookieName];
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).render("error", { title: "Forbidden", message: "Admins only.", user: req.user });
    return;
  }
  next();
}

export function requireAuthApi(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}
