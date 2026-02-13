/**
 * auth-routes.ts — Endpoints de autenticación
 *
 * POST /api/auth/customer/register   — Registro cliente
 * POST /api/auth/customer/login      — Login cliente
 * POST /api/auth/restaurant/login    — Login restaurante
 * POST /api/auth/admin/login         — Login admin
 * POST /api/auth/refresh             — Renovar access token
 * POST /api/auth/logout              — Cerrar sesión
 * GET  /api/auth/me                  — Info del usuario autenticado
 */
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  verifyJwt,
  accessTokenCookie,
  refreshTokenCookie,
  clearAuthCookies,
  parseCookies,
  type TokenPayload,
} from "./auth.js";
import { requireAuth } from "./auth-middleware.js";

export function registerAuthRoutes(app: FastifyInstance, prisma: PrismaClient) {

  // ─── REGISTRO CLIENTE ─────────────────────────────────
  app.post("/api/auth/customer/register", async (req, reply) => {
    const body = (req.body ?? {}) as any;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim() || null;

    if (!email || !email.includes("@")) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "Email inválido" });
    }
    if (password.length < 6) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "La contraseña debe tener al menos 6 caracteres" });
    }
    if (!name || name.length < 2) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "Nombre es obligatorio (mín. 2 caracteres)" });
    }

    // Check duplicado
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({ ok: false, error: "EMAIL_EXISTS", message: "Ya existe una cuenta con este email" });
    }

    const passwordHash = await hashPassword(password);
    const customer = await prisma.customer.create({
      data: { email, passwordHash, name, phone },
    });

    const tokenBase = { sub: customer.id, role: "customer" as const, email: customer.email };
    const accessToken = createAccessToken(tokenBase);
    const refreshToken = createRefreshToken(tokenBase);

    reply.header("Set-Cookie", accessTokenCookie(accessToken));
    reply.header("Set-Cookie", refreshTokenCookie(refreshToken));

    return {
      ok: true,
      accessToken,
      user: { id: customer.id, email: customer.email, name: customer.name, role: "customer" },
    };
  });

  // ─── LOGIN CLIENTE ────────────────────────────────────
  app.post("/api/auth/customer/login", async (req, reply) => {
    const body = (req.body ?? {}) as any;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "Email y contraseña son obligatorios" });
    }

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer || !customer.isActive) {
      return reply.code(401).send({ ok: false, error: "INVALID_CREDENTIALS", message: "Email o contraseña incorrectos" });
    }

    const valid = await verifyPassword(password, customer.passwordHash);
    if (!valid) {
      return reply.code(401).send({ ok: false, error: "INVALID_CREDENTIALS", message: "Email o contraseña incorrectos" });
    }

    const tokenBase = { sub: customer.id, role: "customer" as const, email: customer.email };
    const accessToken = createAccessToken(tokenBase);
    const refreshToken = createRefreshToken(tokenBase);

    reply.header("Set-Cookie", accessTokenCookie(accessToken));
    reply.header("Set-Cookie", refreshTokenCookie(refreshToken));

    return {
      ok: true,
      accessToken,
      user: { id: customer.id, email: customer.email, name: customer.name, role: "customer" },
    };
  });

  // ─── LOGIN RESTAURANTE ────────────────────────────────
  app.post("/api/auth/restaurant/login", async (req, reply) => {
    const body = (req.body ?? {}) as any;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "Email y contraseña son obligatorios" });
    }

    const user = await prisma.restaurantUser.findUnique({
      where: { email },
      include: { restaurant: { select: { id: true, name: true, isActive: true } } },
    });

    if (!user || !user.isActive) {
      return reply.code(401).send({ ok: false, error: "INVALID_CREDENTIALS", message: "Email o contraseña incorrectos" });
    }

    if (!user.restaurant?.isActive) {
      return reply.code(403).send({ ok: false, error: "RESTAURANT_INACTIVE", message: "Este restaurante está desactivado. Contacta con soporte." });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ ok: false, error: "INVALID_CREDENTIALS", message: "Email o contraseña incorrectos" });
    }

    const tokenBase = {
      sub: user.id,
      role: "restaurant" as const,
      restaurantId: user.restaurantId,
      email: user.email,
    };
    const accessToken = createAccessToken(tokenBase);
    const refreshToken = createRefreshToken(tokenBase);

    reply.header("Set-Cookie", accessTokenCookie(accessToken));
    reply.header("Set-Cookie", refreshTokenCookie(refreshToken));

    return {
      ok: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: "restaurant",
        restaurantRole: user.role,
        restaurantId: user.restaurantId,
        restaurantName: user.restaurant.name,
      },
    };
  });

  // ─── LOGIN ADMIN ──────────────────────────────────────
  app.post("/api/auth/admin/login", async (req, reply) => {
    const body = (req.body ?? {}) as any;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "Email y contraseña son obligatorios" });
    }

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      return reply.code(401).send({ ok: false, error: "INVALID_CREDENTIALS", message: "Email o contraseña incorrectos" });
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      return reply.code(401).send({ ok: false, error: "INVALID_CREDENTIALS", message: "Email o contraseña incorrectos" });
    }

    const tokenBase = { sub: admin.id, role: "admin" as const, email: admin.email };
    const accessToken = createAccessToken(tokenBase);
    const refreshToken = createRefreshToken(tokenBase);

    reply.header("Set-Cookie", accessTokenCookie(accessToken));
    reply.header("Set-Cookie", refreshTokenCookie(refreshToken));

    return {
      ok: true,
      accessToken,
      user: { id: admin.id, email: admin.email, name: admin.name, role: "admin" },
    };
  });

  // ─── REFRESH TOKEN ────────────────────────────────────
  app.post("/api/auth/refresh", async (req, reply) => {
    const cookies = parseCookies(req.headers?.cookie ?? "");
    const refreshToken = cookies.bb_refresh;

    if (!refreshToken) {
      return reply.code(401).send({ ok: false, error: "NO_REFRESH_TOKEN", message: "No hay refresh token" });
    }

    const payload = verifyJwt(refreshToken);
    if (!payload) {
      // Limpiar cookies si el refresh token es inválido
      for (const c of clearAuthCookies()) reply.header("Set-Cookie", c);
      return reply.code(401).send({ ok: false, error: "INVALID_REFRESH", message: "Refresh token inválido o expirado" });
    }

    // Verificar que el usuario sigue activo
    let isActive = false;
    if (payload.role === "customer") {
      const c = await prisma.customer.findUnique({ where: { id: payload.sub }, select: { isActive: true } });
      isActive = c?.isActive ?? false;
    } else if (payload.role === "restaurant") {
      const r = await prisma.restaurantUser.findUnique({ where: { id: payload.sub }, select: { isActive: true } });
      isActive = r?.isActive ?? false;
    } else if (payload.role === "admin") {
      const a = await prisma.adminUser.findUnique({ where: { id: payload.sub }, select: { isActive: true } });
      isActive = a?.isActive ?? false;
    }

    if (!isActive) {
      for (const c of clearAuthCookies()) reply.header("Set-Cookie", c);
      return reply.code(403).send({ ok: false, error: "ACCOUNT_DISABLED", message: "Cuenta desactivada" });
    }

    const tokenBase = {
      sub: payload.sub,
      role: payload.role,
      email: payload.email,
      ...(payload.restaurantId ? { restaurantId: payload.restaurantId } : {}),
    };
    const newAccessToken = createAccessToken(tokenBase);

    reply.header("Set-Cookie", accessTokenCookie(newAccessToken));

    return { ok: true, accessToken: newAccessToken };
  });

  // ─── LOGOUT ───────────────────────────────────────────
  app.post("/api/auth/logout", async (_req, reply) => {
    for (const c of clearAuthCookies()) reply.header("Set-Cookie", c);
    return { ok: true };
  });

  // ─── ME (info usuario actual) ─────────────────────────
  app.get("/api/auth/me", {
    onRequest: [requireAuth("customer", "restaurant", "admin")],
  }, async (req) => {
    const user = req.authUser!;

    if (user.role === "customer") {
      const c = await prisma.customer.findUnique({
        where: { id: user.sub },
        select: { id: true, email: true, name: true, phone: true, address: true, city: true, postalCode: true, lat: true, lng: true },
      });
      return { ok: true, user: { ...c, role: "customer" } };
    }

    if (user.role === "restaurant") {
      const r = await prisma.restaurantUser.findUnique({
        where: { id: user.sub },
        include: { restaurant: { select: { id: true, name: true, slug: true } } },
      });
      return {
        ok: true,
        user: {
          id: r?.id,
          email: r?.email,
          role: "restaurant",
          restaurantRole: r?.role,
          restaurantId: r?.restaurantId,
          restaurantName: r?.restaurant?.name,
          restaurantSlug: r?.restaurant?.slug,
        },
      };
    }

    if (user.role === "admin") {
      const a = await prisma.adminUser.findUnique({
        where: { id: user.sub },
        select: { id: true, email: true, name: true },
      });
      return { ok: true, user: { ...a, role: "admin" } };
    }

    return { ok: false, error: "UNKNOWN_ROLE" };
  });

  // ─── ADMIN: Crear usuario restaurante (al dar de alta restaurante) ──
  app.post("/api/admin/restaurant-users", {
    onRequest: [requireAuth("admin")],
  }, async (req, reply) => {
    const body = (req.body ?? {}) as any;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const restaurantId = String(body.restaurantId ?? "").trim();
    const role = String(body.role ?? "OWNER").toUpperCase();
    const name = String(body.name ?? "").trim() || email;

    if (!email || !email.includes("@")) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "Email inválido" });
    }
    if (password.length < 6) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "Contraseña mín. 6 caracteres" });
    }
    if (!restaurantId) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "restaurantId es obligatorio" });
    }

    // Verificar que el restaurante existe
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND", message: "Restaurante no encontrado" });
    }

    // Check duplicado
    const existing = await prisma.restaurantUser.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({ ok: false, error: "EMAIL_EXISTS", message: "Ya existe un usuario con este email" });
    }

    const validRoles = ["OWNER", "MANAGER", "STAFF"];
    const finalRole = validRoles.includes(role) ? role : "OWNER";

    const passwordHash = await hashPassword(password);
    const user = await prisma.restaurantUser.create({
      data: {
        email,
        passwordHash,
        restaurantId,
        role: finalRole as any,
      },
      select: { id: true, email: true, role: true, restaurantId: true },
    });

    return { ok: true, data: user };
  });

  // ─── ADMIN: Cambiar contraseña de usuario restaurante ──
  app.post("/api/admin/restaurant-users/:id/reset-password", {
    onRequest: [requireAuth("admin")],
  }, async (req: any, reply) => {
    const id = String(req.params?.id ?? "").trim();
    const body = (req.body ?? {}) as any;
    const newPassword = String(body.password ?? "");

    if (!id) return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "id es obligatorio" });
    if (newPassword.length < 6) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "Contraseña mín. 6 caracteres" });
    }

    const user = await prisma.restaurantUser.findUnique({ where: { id } });
    if (!user) return reply.code(404).send({ ok: false, error: "NOT_FOUND", message: "Usuario no encontrado" });

    const passwordHash = await hashPassword(newPassword);
    await prisma.restaurantUser.update({ where: { id }, data: { passwordHash } });

    return { ok: true, message: "Contraseña actualizada" };
  });

  // ─── RESTAURANTE: Cambiar mi propia contraseña ────────
  app.post("/api/auth/restaurant/change-password", {
    onRequest: [requireAuth("restaurant")],
  }, async (req, reply) => {
    const user = req.authUser!;
    const body = (req.body ?? {}) as any;
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (!currentPassword || !newPassword) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "Contraseña actual y nueva son obligatorias" });
    }
    if (newPassword.length < 6) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    const dbUser = await prisma.restaurantUser.findUnique({ where: { id: user.sub } });
    if (!dbUser) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND", message: "Usuario no encontrado" });
    }

    const valid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!valid) {
      return reply.code(401).send({ ok: false, error: "INVALID_PASSWORD", message: "Contraseña actual incorrecta" });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.restaurantUser.update({ where: { id: user.sub }, data: { passwordHash } });

    return { ok: true, message: "Contraseña actualizada correctamente" };
  });

  // ─── CLIENTE: Cambiar mi propia contraseña ────────────
  app.post("/api/auth/customer/change-password", {
    onRequest: [requireAuth("customer")],
  }, async (req, reply) => {
    const user = req.authUser!;
    const body = (req.body ?? {}) as any;
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (!currentPassword || !newPassword) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "Contraseña actual y nueva son obligatorias" });
    }
    if (newPassword.length < 6) {
      return reply.code(400).send({ ok: false, error: "BAD_REQUEST", message: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    const dbUser = await prisma.customer.findUnique({ where: { id: user.sub } });
    if (!dbUser) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND", message: "Usuario no encontrado" });
    }

    const valid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!valid) {
      return reply.code(401).send({ ok: false, error: "INVALID_PASSWORD", message: "Contraseña actual incorrecta" });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.customer.update({ where: { id: user.sub }, data: { passwordHash } });

    return { ok: true, message: "Contraseña actualizada correctamente" };
  });
}
