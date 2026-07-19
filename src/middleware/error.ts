import { Request, Response, NextFunction } from "express";
import multer from "multer";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).render("error", {
    title: "Not found",
    message: "The page or file you requested does not exist.",
    user: req.user,
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    res.status(400).render("error", {
      title: "Upload failed",
      message: err.message,
      user: req.user,
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Something went wrong.";
  console.error(err);
  res.status(500).render("error", {
    title: "Server error",
    message,
    user: req.user,
  });
}
