export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_banned: number;
  created_at: string;
}

export interface FileRecord {
  id: string;
  owner_id: string | null;
  original_name: string;
  storage_key: string;
  size: number;
  mime_type: string;
  storage_driver: string;
  download_count: number;
  is_public: number;
  created_at: string;
}

export interface AuthPayload {
  sub: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export {};
