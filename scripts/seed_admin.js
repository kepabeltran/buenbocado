/**
 * seed_admin.js — Crea el primer usuario admin en la BD.
 *
 * Uso:
 *   node scripts/seed_admin.js
 *
 * Variables de entorno (o se usan los defaults):
 *   ADMIN_EMAIL=admin@buenbocado.com
 *   ADMIN_PASSWORD=admin123456
 *   ADMIN_NAME=Admin
 */
import crypto from "node:crypto";

// ─── Minimal scrypt hash (same as auth.ts) ───────────────
const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(plain, salt, SCRYPT_KEYLEN, { N: SCRYPT_COST }, (err, derived) => {
      if (err) return reject(err);
      resolve(`${salt}:${derived.toString("hex")}`);
    });
  });
}

// ─── Load .env ───────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env"),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2]?.trim() ?? "";
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
    break;
  }
}

loadEnv();

// ─── Prisma ──────────────────────────────────────────────
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@buenbocado.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123456";
  const name = process.env.ADMIN_NAME || "Admin";

  console.log(`\n🔑 Creando admin: ${email}\n`);

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log("⚠️  Ya existe un admin con este email. Actualizando contraseña...");
    const passwordHash = await hashPassword(password);
    await prisma.adminUser.update({ where: { email }, data: { passwordHash, name } });
    console.log("✅ Contraseña actualizada.\n");
  } else {
    const passwordHash = await hashPassword(password);
    await prisma.adminUser.create({ data: { email, passwordHash, name } });
    console.log("✅ Admin creado correctamente.\n");
  }

  console.log("   Email:    ", email);
  console.log("   Password: ", password);
  console.log("\n   ⚠️  Cambia la contraseña en producción!\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
