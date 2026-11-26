import { Router } from "express";
import {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import db from "../config/database.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

router.get('/me', authenticate, (req, res) => {
    return res.status(200).json({
        message: 'Usuário autenticado!',
        user: req.user
    });
});

router.post('/logout', authenticate, (req, res) => {
    const token = req.cookies?.portfolio_session;

    const tokenHash = createHash('sha256')
        .update(token)
        .digest('hex');

    db.prepare(`
        DELETE FROM sessions
        WHERE token_hash = ?
    `).run(tokenHash);

    res.clearCookie('portfolio_session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });

    return res.status(200).json({
        message: 'Logout realizado com sucesso!'
    });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Informe email e senha.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = db
    .prepare(
      `
        SELECT id, name, email, password
        FROM users
        WHERE email = ?`,
    )
    .get(normalizedEmail);

  if (!user) {
    return res.status(401).json({
      message: "Email ou senha inválidos.",
    });
  }

  const [salt, storedHash] = user.password.split(":");

  const passwordHash = scryptSync(password, salt, 64);
  const storedHashBuffer = Buffer.from(storedHash, "hex");

  if (
    storedHashBuffer.length !== passwordHash.length ||
    !timingSafeEqual(passwordHash, storedHashBuffer)
  ) {
    return res.status(401).json({
      message: "Email ou senha inválidos.",
    });
  }

  const token = randomBytes(32).toString("hex");

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const expiresAt = Date.now() + SESSION_DURATION;

  db.prepare(
    `
        INSERT INTO sessions (user_id, token_hash, expires_at, expires)
        VALUES (?, ?, ?, ?)
    `,
  ).run(user.id, tokenHash, expiresAt, expiresAt);

  res.cookie("portfolio_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  return res.status(200).json({
    message: "Login realizado com sucesso!",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

export default router;