/**
 * auth-middleware.ts — Middleware de autenticación para Fastify
 *
 * ✔ Requiere token (cookie bb_access o Authorization: Bearer ...)
 * ✔ Verifica firma/exp de JWT
 * ✔ Verifica rol permitido
 * ✔ EXTRA (importante): valida en BD que el usuario sigue activo.
 *    - restaurant: RestaurantUser.isActive AND Restaurant.isActive
 *    - customer: Customer.isActive
 *    - admin: AdminUser.isActive
 *
 * Motivo: si un restaurante se suspende mientras está logeado, el token sigue siendo válido.
 * Con esta validación, se corta el acceso “en caliente”.
 */
import type { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { extractToken, verifyJwt, type TokenPayload, type TokenRole } from "./auth.js";

// Prisma singleton para checks de sesión (separado del prisma principal del API).
// En producción lo ideal es compartir el mismo PrismaClient, pero para MVP es robusto y simple.
const prisma = new PrismaClient();

// Extendemos el tipo de request para adjuntar el usuario autenticado
declare module "fastify" {
  interface FastifyRequest {
    authUser?: TokenPayload;
  }
}

async function ensureActive(payload: TokenPayload, reply: FastifyReply): Promise<boolean> {
  try {
    if (payload.role === "restaurant") {
      const restaurantId = payload.restaurantId;
      if (!restaurantId) {
        reply.code(403).send({
          ok: false,
          error: "FORBIDDEN",
          message: "Token de restaurante sin restaurantId",
        });
        return false;
      }

      const dbUser = await prisma.restaurantUser.findUnique({
        where: { id: payload.sub },
        select: {
          isActive: true,
          restaurant: { select: { isActive: true } },
        },
      });

      if (!dbUser) {
        reply.code(401).send({
          ok: false,
          error: "UNAUTHORIZED",
          message: "Usuario no encontrado",
        });
        return false;
      }

      if (!dbUser.isActive) {
        reply.code(403).send({
          ok: false,
          error: "USER_INACTIVE",
          message: "Este usuario está desactivado. Contacta con soporte.",
        });
        return false;
      }

      if (!dbUser.restaurant?.isActive) {
        reply.code(403).send({
          ok: false,
          error: "RESTAURANT_INACTIVE",
          message: "Este restaurante está desactivado. Contacta con soporte.",
        });
        return false;
      }

      return true;
    }

    if (payload.role === "customer") {
      const c = await prisma.customer.findUnique({
        where: { id: payload.sub },
        select: { isActive: true },
      });
      if (!c) {
        reply.code(401).send({ ok: false, error: "UNAUTHORIZED", message: "Usuario no encontrado" });
        return false;
      }
      if (!c.isActive) {
        reply.code(403).send({ ok: false, error: "USER_INACTIVE", message: "Tu cuenta está desactivada." });
        return false;
      }
      return true;
    }

    if (payload.role === "admin") {
      const a = await prisma.adminUser.findUnique({
        where: { id: payload.sub },
        select: { isActive: true },
      });
      if (!a) {
        reply.code(401).send({ ok: false, error: "UNAUTHORIZED", message: "Usuario no encontrado" });
        return false;
      }
      if (!a.isActive) {
        reply.code(403).send({ ok: false, error: "USER_INACTIVE", message: "Tu cuenta está desactivada." });
        return false;
      }
      return true;
    }

    return true;
  } catch (e) {
    // Si falla la comprobación en BD, preferimos fallar “cerrado”.
    reply.code(503).send({
      ok: false,
      error: "AUTH_CHECK_FAILED",
      message: "No se pudo validar el estado de la cuenta",
    });
    return false;
  }
}

/**
 * Middleware que REQUIERE autenticación con un rol específico.
 * Si el token no es válido o el rol no coincide → 401/403.
 */
export function requireAuth(...allowedRoles: TokenRole[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const token = extractToken(request);

    if (!token) {
      return reply.code(401).send({
        ok: false,
        error: "UNAUTHORIZED",
        message: "Token de acceso requerido",
      });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return reply.code(401).send({
        ok: false,
        error: "UNAUTHORIZED",
        message: "Token inválido o expirado",
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      return reply.code(403).send({
        ok: false,
        error: "FORBIDDEN",
        message: "No tienes permisos para esta acción",
      });
    }

    // Adjuntar usuario al request
    request.authUser = payload;

    // ✅ Cortar acceso si el usuario/restaurante está desactivado
    const ok = await ensureActive(payload, reply);
    if (!ok) return;
  };
}

/**
 * Middleware OPCIONAL: no falla si no hay token, pero si lo hay y es válido,
 * adjunta authUser al request.
 *
 * Nota: aquí NO hacemos consulta a BD para no penalizar endpoints públicos.
 */
export function optionalAuth() {
  return function (request: FastifyRequest, _reply: FastifyReply, done: any) {
    const token = extractToken(request);
    if (token) {
      const payload = verifyJwt(token);
      if (payload) {
        request.authUser = payload;
      }
    }
    done();
  };
}
