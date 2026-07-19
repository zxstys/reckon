# Reckon

Reckon is an open-source and free cloud storage and file hosting service

## Features

- Single-click upload, remote upload by URL
- Email/password authentication with JWT stored in an httpOnly cookie
- Per-user dashboard listing and deleting your own files
- Admin panel: server stats, user management (ban/delete), file management (delete any file)
- Storage driver selected via `STORAGE_DRIVER=local|s3` — local uses disk storage via Multer, S3 uses `multer-s3` for uploads and the AWS SDK v3 for reads/deletes/presigned URLs
- Works with any S3-compatible provider (AWS S3, Cloudflare R2, MinIO, Backblaze B2) via `S3_ENDPOINT` / `S3_FORCE_PATH_STYLE`

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

- Set `JWT_SECRET` to a long random string
- Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` — an admin account is created automatically on first boot if it doesn't already exist
- Leave `STORAGE_DRIVER=local` to store files on disk (`LOCAL_STORAGE_PATH`), or set `STORAGE_DRIVER=s3` and fill in `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`

## Development

```bash
npm run dev
```

Runs the TypeScript server with hot reload and watches/rebuilds the Tailwind CSS output together.

## Production

```bash
npm run build
npm start
```

`npm run build` compiles TypeScript to `dist/`, builds and minifies the Tailwind CSS bundle, and copies the EJS views into `dist/views`.

## Project layout

```
src/
  config/       env-driven configuration, storage validation
  db/           SQLite schema and connection (better-sqlite3)
  storage/      StorageProvider interface + local & S3 implementations
  middleware/   auth (JWT cookie), multer upload wiring, error handling
  controllers/  auth, files (upload/download/dashboard), admin
  routes/       Express routers
  services/     DB access for users and files
  views/        EJS templates styled with Tailwind
  styles/       Tailwind v4 input CSS
```

## Switching storage providers

Nothing in the codebase needs to change. Only `.env`:

```
STORAGE_DRIVER=local
LOCAL_STORAGE_PATH=./storage/local
```

or

```
STORAGE_DRIVER=s3
S3_BUCKET=my-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
# optional, for R2/MinIO/other S3-compatible providers
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_FORCE_PATH_STYLE=true
```

## Notes

- The default admin account is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` on first boot — change the password after logging in for the first time in a real deployment, and put a real secret in `JWT_SECRET`.
- Remote upload rejects `localhost`, `.local`, and private IP ranges to reduce SSRF risk, but treat it as a starting point, not a complete hardening pass, before exposing it publicly.
- SQLite is used for simplicity. For multi-instance deployments, swap `src/db` for a networked database.
