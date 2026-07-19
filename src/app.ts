import path from "path";
import express, { Express } from "express";
import cookieParser from "cookie-parser";
import { attachUser } from "./middleware/auth";
import { notFoundHandler, errorHandler } from "./middleware/error";
import authRoutes from "./routes/auth.routes";
import filesRoutes from "./routes/files.routes";
import adminRoutes from "./routes/admin.routes";
import { config } from "./config";

export function createApp(): Express {
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(attachUser);
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.locals.appName = config.appName;

  app.use("/", authRoutes);
  app.use("/", filesRoutes);
  app.use("/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
