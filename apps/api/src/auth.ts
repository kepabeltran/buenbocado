/**
 * auth.ts — Módulo de autenticación para BuenBocado API
 *
 * Maneja: hash de contraseñas (scrypt), generación y verificación de JWT,
 * y tipos compartidos para los tokens.
 */
import crypto from "node:crypto";

// ─── Tipos ────────────────────────────────────────────────

export type TokenRole = "customer" | "restaurant" | "admin";

export type TokenPayload = {
  sub: string;           // userId / restaurantUserId / adminUserId
  role: TokenRole;
  restaurantId?: string; // solo para role=restaurant
  email: string;
  iat: number;
  exp: number;
};

// ─── Configuración ────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || "buenbocado-dev-secret-cambiame";
const ACCESS_TOKEN_TTL = 8 * 60 * 60;         // 8 horas
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 días

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.error("⚠️  JWT_SECRET no está definido en producción. Abortando.");
  process.exit(1);
}

// ─── Password hashing (scrypt — nativo, sin deps) ────────

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(plain, salt, SCRYPT_KEYLEN, { N: SCRYPT_COST }, (err, derived) => {
      if (err) return reject(err);
      resolve(`${salt}:${derived.toString("hex")}`);
    });
  });
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return new Promise((resolve, reject) => {
    crypto.scrypt(plain, salt, SCRYPT_KEYLEN, { N: SCRYPT_COST }, (err, derived) => {
      if (err) return reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(hash, "hex"), derived));
    });
  });
}

// ─── JWT (implementación manual, sin jsonwebtoken dep) ────

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

function base64urlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

export function createAccessToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return signJwt(payload, ACCESS_TOKEN_TTL);
}

export function createRefreshToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return signJwt(payload, REFRESH_TOKEN_TTL);
}

function signJwt(payload: Omit<TokenPayload, "iat" | "exp">, ttlSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const body: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };

  const segments = [
    base64url(JSON.stringify(header)),
    base64url(JSON.stringify(body)),
  ];

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(segments.join("."))
    .digest();

  segments.push(base64url(signature));
  return segments.join(".");
}

export function verifyJwt(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verificar firma
    const expected = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest();

    const actual = base64urlDecode(signatureB64!);
    if (!crypto.timingSafeEqual(expected, actual)) return null;

    // Decodificar payload
    const payload = JSON.parse(base64urlDecode(payloadB64!).toString()) as TokenPayload;

    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

// ─── Helpers para extraer token de request ────────────────

export function extractToken(request: any): string | null {
  // 1) Cookie httpOnly "bb_access"
  const cookies = parseCookies(request.headers?.cookie ?? "");
  if (cookies.bb_access) return cookies.bb_access;

  // 2) Header Authorization: Bearer ...
  const authHeader = String(request.headers?.authorization ?? "");
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7);

  return null;
}

export function parseCookies(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const idx = pair.indexOf("=");
    if (idx < 0) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) result[key] = decodeURIComponent(val);
  }
  return result;
}

// ─── Cookie helpers ───────────────────────────────────────

const isProd = process.env.NODE_ENV === "production";

export function accessTokenCookie(token: string): string {
  const maxAge = ACCESS_TOKEN_TTL;
  return `bb_access=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${isProd ? "; Secure" : ""}`;
}

export function refreshTokenCookie(token: string): string {
  const maxAge = REFRESH_TOKEN_TTL;
  return `bb_refresh=${token}; HttpOnly; Path=/api/auth/refresh; Max-Age=${maxAge}; SameSite=Lax${isProd ? "; Secure" : ""}`;
}

export function clearAuthCookies(): string[] {
  return [
    `bb_access=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isProd ? "; Secure" : ""}`,
    `bb_refresh=; HttpOnly; Path=/api/auth/refresh; Max-Age=0; SameSite=Lax${isProd ? "; Secure" : ""}`,
  ];
}
