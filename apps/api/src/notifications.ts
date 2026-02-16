/**
 * notifications.ts — Sistema de notificaciones de BuenBocado
 *
 * En desarrollo: console.log con los datos del mensaje
 * En producción: Resend (descomentar cuando esté configurado)
 *
 * Para activar Resend:
 *   1. npm install resend
 *   2. Añadir RESEND_API_KEY y MAIL_FROM al .env
 *   3. Descomentar las líneas marcadas con [RESEND]
 */

// [RESEND] import { Resend } from "resend";
// [RESEND] const resend = new Resend(process.env.RESEND_API_KEY);

const MAIL_FROM = process.env.MAIL_FROM || "BuenBocado <hola@buenbocado.es>";
const APP_URL_RESTAURANT = process.env.APP_URL_RESTAURANT || "http://localhost:3001";
const IS_DEV = !process.env.RESEND_API_KEY;

// ─── Envío base ──────────────────────────────────────────────
interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (IS_DEV) {
    console.log("\n╔══════════════════════════════════════════════════");
    console.log("║ 📧 EMAIL (dev — no se envía realmente)");
    console.log("╠══════════════════════════════════════════════════");
    console.log(`║ Para:    ${payload.to}`);
    console.log(`║ Asunto:  ${payload.subject}`);
    console.log("╠══════════════════════════════════════════════════");
    console.log(payload.html.replace(/<[^>]+>/g, "").trim());
    console.log("╚══════════════════════════════════════════════════\n");
    return true;
  }

  /* [RESEND]
  try {
    await resend.emails.send({
      from: MAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    return true;
  } catch (err) {
    console.error("[NOTIFY] Error enviando email:", err);
    return false;
  }
  */

  return false;
}

// ─── Email confirmación de pedido (para el cliente) ──────────
export function orderConfirmationEmail(data: {
  customerName: string;
  code: string;
  menuTitle: string;
  restaurantName: string;
  restaurantAddress: string;
  totalFormatted: string;
  availableTo: string;
}): { subject: string; html: string } {
  return {
    subject: `Pedido confirmado #${data.code} — ${data.restaurantName}`,
    html: `
      <div style="font-family:'DM Sans',system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <h1 style="color:#10b981;font-size:22px;margin:0 0 16px">¡Pedido confirmado!</h1>
        <p style="color:#444;font-size:16px;margin:0 0 20px">
          Hola <strong>${data.customerName}</strong>, hemos recibido tu pedido correctamente.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:0 0 20px">
          <p style="margin:0 0 6px;font-size:15px"><strong>Código:</strong> ${data.code}</p>
          <p style="margin:0 0 6px;font-size:15px"><strong>Oferta:</strong> ${data.menuTitle}</p>
          <p style="margin:0 0 6px;font-size:15px"><strong>Total:</strong> ${data.totalFormatted}</p>
          <p style="margin:0 0 6px;font-size:15px"><strong>Restaurante:</strong> ${data.restaurantName}</p>
          <p style="margin:0 0 6px;font-size:15px"><strong>Dirección:</strong> ${data.restaurantAddress}</p>
          <p style="margin:0;font-size:15px"><strong>Recoge antes de:</strong> ${data.availableTo}</p>
        </div>
        <p style="color:#666;font-size:14px;margin:0 0 20px">
          Presenta el código <strong>#${data.code}</strong> en el restaurante al recoger tu pedido.
        </p>
        <a href="https://www.google.com/maps/search/${encodeURIComponent(data.restaurantAddress)}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
          Cómo llegar
        </a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="margin:0;font-size:12px;color:#aaa">BuenBocado — Ofertas de última hora de tus restaurantes favoritos</p>
      </div>
    `,
  };
}

// ─── Email pedido entregado (para el cliente) ────────────────
export function orderDeliveredEmail(data: {
  customerName: string;
  menuTitle: string;
  restaurantName: string;
  totalFormatted: string;
}): { subject: string; html: string } {
  return {
    subject: `Pedido entregado — ${data.restaurantName}`,
    html: `
      <div style="font-family:'DM Sans',system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <h1 style="color:#10b981;font-size:22px;margin:0 0 16px">¡Pedido entregado!</h1>
        <p style="color:#444;font-size:16px;margin:0 0 20px">
          Hola <strong>${data.customerName}</strong>, tu pedido ha sido entregado. ¡Que aproveche!
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:0 0 20px">
          <p style="margin:0 0 6px;font-size:15px"><strong>Oferta:</strong> ${data.menuTitle}</p>
          <p style="margin:0 0 6px;font-size:15px"><strong>Restaurante:</strong> ${data.restaurantName}</p>
          <p style="margin:0;font-size:15px"><strong>Total:</strong> ${data.totalFormatted}</p>
        </div>
        <p style="color:#666;font-size:14px;margin:0 0 20px">
          Gracias por usar BuenBocado. ¡Esperamos verte pronto!
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="margin:0;font-size:12px;color:#aaa">BuenBocado — Ofertas de última hora de tus restaurantes favoritos</p>
      </div>
    `,
  };
}

// ─── Bienvenida restaurante (credenciales de acceso) ─────────
export async function notifyRestaurantWelcome(data: {
  email: string;
  password: string;
  restaurantName: string;
  role: string;
}): Promise<boolean> {
  return sendEmail({
    to: data.email,
    subject: `Bienvenido a BuenBocado, ${data.restaurantName}`,
    html: `
      <div style="font-family:'DM Sans',system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <h1 style="color:#10b981;font-size:24px;margin:0 0 8px">Bienvenido a BuenBocado</h1>
        <p style="color:#444;font-size:16px;margin:0 0 24px">
          Tu restaurante <strong>${data.restaurantName}</strong> ya está dado de alta en la plataforma.
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:0 0 24px">
          <p style="margin:0 0 8px;font-size:14px;color:#166534"><strong>Tus credenciales de acceso:</strong></p>
          <p style="margin:0;font-size:14px;color:#333">
            Email: <strong>${data.email}</strong><br>
            Contraseña temporal: <strong>${data.password}</strong><br>
            Rol: <strong>${data.role}</strong>
          </p>
        </div>
        <a href="${APP_URL_RESTAURANT}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
          Acceder al portal
        </a>
        <p style="margin:24px 0 0;font-size:13px;color:#999">
          Te recomendamos cambiar tu contraseña después del primer inicio de sesión.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="margin:0;font-size:12px;color:#aaa">BuenBocado — Ofertas de última hora de tus restaurantes favoritos</p>
      </div>
    `,
  });
}
