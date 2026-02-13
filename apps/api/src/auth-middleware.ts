/**
 * auth-middleware.ts — Middleware de autenticación para Fastify
 *
 * Uso:
 *   app.addHook("onRequest", requireAuth("restaurant"));
 *   app.addHook("onRequest", requireAuth("admin"));
 *   app.addHook("onRequest", requireAuth("customer"));
 *   app.addHook("onRequest", optionalAuth());  // no falla, pero adjunta user si hay token
 */
import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify";
import { extractToken, verifyJwt, type TokenPayload, type TokenRole } from "./auth.js";

// Extendemos el tipo de request para adjuntar el usuario autenticado
declare module "fastify" {
  interface FastifyRequest {
    authUser?: TokenPayload;
  }
}

/**
 * Middleware que REQUIERE autenticación con un rol específico.
 * Si el token no es válido o el rol no coincide → 401/403.
 */
export function requireAuth(...allowedRoles: TokenRole[]) {
  return function (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) {
    const token = extractToken(request);

    if (!token) {
      reply.code(401).send({
        ok: false,
        error: "UNAUTHORIZED",
        message: "Token de acceso requerido",
      });
      return;
    }

    const payload = verifyJwt(token);
    if (!payload) {
      reply.code(401).send({
        ok: false,
        error: "UNAUTHORIZED",
        message: "Token inválido o expirado",
      });
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      reply.code(403).send({
        ok: false,
        error: "FORBIDDEN",
        message: "No tienes permisos para esta acción",
      });
      return;
    }

    // Adjuntar usuario al request
    request.authUser = payload;
    done();
  };
}

/**
 * Middleware OPCIONAL: no falla si no hay token, pero si lo hay
 * y es válido, adjunta authUser al request.
 * Útil para endpoints públicos que se comportan diferente si hay sesión.
 */
export function optionalAuth() {
  return function (request: FastifyRequest, _reply: FastifyReply, done: HookHandlerDoneFunction) {
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
