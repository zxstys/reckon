import { nanoid } from "nanoid";
import { db } from "../db";
import { User, UserRole } from "../types";
import { hashPassword } from "../utils/password";

export function findUserByEmail(email: string): User | undefined {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
}

export function findUserById(id: string): User | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export async function createUser(
  email: string,
  password: string,
  role: UserRole = "user"
): Promise<User> {
  const id = nanoid(16);
  const passwordHash = await hashPassword(password);
  db.prepare(
    "INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)"
  ).run(id, email, passwordHash, role);
  return findUserById(id) as User;
}

export function listUsers(): User[] {
  return db.prepare("SELECT * FROM users ORDER BY created_at DESC").all() as User[];
}

export function setUserBanned(id: string, banned: boolean): void {
  db.prepare("UPDATE users SET is_banned = ? WHERE id = ?").run(banned ? 1 : 0, id);
}

export function deleteUser(id: string): void {
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function countUsers(): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  return row.count;
}
