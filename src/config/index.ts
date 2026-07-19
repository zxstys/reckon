import path from "path";
import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function bool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true" || value === "1";
}

export type StorageDriver = "local" | "s3";

export const config = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  appUrl: required("APP_URL", "http://localhost:3000"),
  appName: required("APP_NAME", "Reckon"),

  jwtSecret: required("JWT_SECRET", "dev_secret_change_me"),
  cookieName: required("COOKIE_NAME", "reckon_token"),

  dbPath: path.resolve(process.cwd(), process.env.DB_PATH ?? "./data/reckon.db"),

  maxUploadSizeBytes: parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? "2048", 10) * 1024 * 1024,

  allowAnonymousUploads: bool("ALLOW_ANONYMOUS_UPLOADS", true),

  adminEmail: process.env.ADMIN_EMAIL ?? "admin@reckon.local",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin12345",

  storageDriver: (process.env.STORAGE_DRIVER as StorageDriver) ?? "local",

  local: {
    storagePath: path.resolve(process.cwd(), process.env.LOCAL_STORAGE_PATH ?? "./storage/local"),
  },

  s3: {
    bucket: process.env.S3_BUCKET ?? "",
    region: process.env.S3_REGION ?? "us-east-1",
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: bool("S3_FORCE_PATH_STYLE", false),
    publicUrlBase: process.env.S3_PUBLIC_URL_BASE || undefined,
  },
};

export function assertStorageConfigured(): void {
  if (config.storageDriver === "s3") {
    const missing: string[] = [];
    if (!config.s3.bucket) missing.push("S3_BUCKET");
    if (!config.s3.accessKeyId) missing.push("S3_ACCESS_KEY_ID");
    if (!config.s3.secretAccessKey) missing.push("S3_SECRET_ACCESS_KEY");
    if (missing.length > 0) {
      throw new Error(`STORAGE_DRIVER is set to s3 but missing: ${missing.join(", ")}`);
    }
  }
}
