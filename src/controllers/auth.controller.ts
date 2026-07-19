import { Request, Response } from "express";
import { config } from "../config";
import { createUser, findUserByEmail } from "../services/user.service";
import { verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function showLogin(req: Request, res: Response): void {
  res.render("auth/login", {
    title: "Log in",
    user: req.user,
    error: null,
    next: req.query.next ?? "/",
  });
}

export function showRegister(req: Request, res: Response): void {
  res.render("auth/register", {
    title: "Create account",
    user: req.user,
    error: null,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };
  const next = (req.body.next as string) || "/";

  if (!email || !password) {
    res.status(400).render("auth/login", {
      title: "Log in",
      user: req.user,
      error: "Email and password are required.",
      next,
    });
    return;
  }

  const account = findUserByEmail(email.toLowerCase().trim());
  if (!account || !(await verifyPassword(password, account.password_hash))) {
    res.status(401).render("auth/login", {
      title: "Log in",
      user: req.user,
      error: "Invalid email or password.",
      next,
    });
    return;
  }

  if (account.is_banned) {
    res.status(403).render("auth/login", {
      title: "Log in",
      user: req.user,
      error: "This account has been suspended.",
      next,
    });
    return;
  }

  const token = signToken({ sub: account.id, email: account.email, role: account.role });
  res.cookie(config.cookieName, token, cookieOptions);
  res.redirect(next || "/");
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, confirmPassword } = req.body as {
    email?: string;
    password?: string;
    confirmPassword?: string;
  };

  if (!email || !password) {
    res.status(400).render("auth/register", {
      title: "Create account",
      user: req.user,
      error: "Email and password are required.",
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).render("auth/register", {
      title: "Create account",
      user: req.user,
      error: "Password must be at least 8 characters.",
    });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).render("auth/register", {
      title: "Create account",
      user: req.user,
      error: "Passwords do not match.",
    });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (findUserByEmail(normalizedEmail)) {
    res.status(409).render("auth/register", {
      title: "Create account",
      user: req.user,
      error: "An account with that email already exists.",
    });
    return;
  }

  const account = await createUser(normalizedEmail, password);
  const token = signToken({ sub: account.id, email: account.email, role: account.role });
  res.cookie(config.cookieName, token, cookieOptions);
  res.redirect("/dashboard");
}

export function logout(req: Request, res: Response): void {
  res.clearCookie(config.cookieName);
  res.redirect("/");
}
