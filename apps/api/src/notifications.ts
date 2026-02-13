/**
 * notifications.ts — Servicio de notificaciones
 *
 * Soporta:
 * - Email via Resend (activar con RESEND_API_KEY en .env)
 * - Log en consola (siempre)
 *
 * Para activar emails:
 * 1. Crear cuenta gratis en https://resend.com
 * 2. Obtener API key
 * 3. Añadir a .env: RESEND_API_KEY=re_xxxxx
 * 4. Añadir: EMAIL_FROM=pedidos@tudominio.com (o usar onboarding@resend.dev para pruebas)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const EMAIL_ENABLED = !!RESEND_API_KEY;

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  console.log(`[NOTIF] Email → ${params.to} | Asunto: ${params.subject} | Habilitado: ${EMAIL_ENABLED}`);

  if (!EMAIL_ENABLED) {
    console.log("[NOTIF] Email desactivado (sin RESEND_API_KEY). Contenido:");
    console.log(params.html.replace(/<[^>]*>/g, "").substring(0, 200));
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[NOTIF] Error enviando email:", res.status, body);
      return false;
    }

    console.log("[NOTIF] Email enviado correctamente a", params.to);
    return true;
  } catch (err: any) {
    console.error("[NOTIF] Error de red enviando email:", err?.message || err);
    return false;
  }
}

// ─── PLANTILLAS DE EMAIL ────────────────────────────────

export function orderConfirmationEmail(data: {
  customerName: string;
  code: string;
  menuTitle: string;
  restaurantName: string;
  restaurantAddress: string;
  totalFormatted: string;
  availableTo: string;
}) {
  const subject = `Tu pedido en ${data.restaurantName} — Código ${data.code}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #faf5f0;">
  <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #e5e5e5;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; background: #991b1b; color: white; font-weight: bold; padding: 8px 16px; border-radius: 8px; font-size: 14px;">BuenBocado</div>
    </div>

    <h2 style="margin: 0 0 8px; font-size: 20px; color: #18181b;">¡Pedido confirmado!</h2>
    <p style="margin: 0 0 20px; color: #71717a; font-size: 14px;">Hola ${data.customerName}, tu pedido está en marcha.</p>

    <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <p style="margin: 0 0 4px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Tu código de recogida</p>
      <p style="margin: 0; font-size: 36px; font-weight: 800; color: #18181b; font-family: monospace; letter-spacing: 4px;">${data.code}</p>
    </div>

    <table style="width: 100%; font-size: 14px; color: #3f3f46;">
      <tr>
        <td style="padding: 6px 0; color: #71717a;">Oferta</td>
        <td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.menuTitle}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #71717a;">Restaurante</td>
        <td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.restaurantName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #71717a;">Dirección</td>
        <td style="padding: 6px 0; text-align: right;">${data.restaurantAddress}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #71717a;">Total</td>
        <td style="padding: 6px 0; text-align: right; font-weight: 800; font-size: 16px;">${data.totalFormatted}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #71717a;">Recoger antes de</td>
        <td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.availableTo}</td>
      </tr>
    </table>

    <div style="margin-top: 20px; padding: 12px; background: #fef3c7; border-radius: 8px; font-size: 13px; color: #92400e;">
      <strong>Recuerda:</strong> Muestra este código al restaurante para recoger tu pedido.
    </div>

    <p style="margin-top: 20px; font-size: 12px; color: #a1a1aa; text-align: center;">
      BuenBocado — Ofertas exclusivas de restaurantes cerca de ti
    </p>
  </div>
</body>
</html>`;

  return { subject, html };
}

export function orderDeliveredEmail(data: {
  customerName: string;
  menuTitle: string;
  restaurantName: string;
  totalFormatted: string;
}) {
  const subject = `Pedido entregado — ${data.restaurantName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #faf5f0;">
  <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #e5e5e5;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; background: #991b1b; color: white; font-weight: bold; padding: 8px 16px; border-radius: 8px; font-size: 14px;">BuenBocado</div>
    </div>

    <h2 style="margin: 0 0 8px; font-size: 20px; color: #18181b;">✅ Pedido entregado</h2>
    <p style="margin: 0 0 16px; color: #71717a; font-size: 14px;">Hola ${data.customerName}, tu pedido ha sido entregado.</p>

    <table style="width: 100%; font-size: 14px; color: #3f3f46;">
      <tr>
        <td style="padding: 6px 0; color: #71717a;">Oferta</td>
        <td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.menuTitle}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #71717a;">Restaurante</td>
        <td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.restaurantName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #71717a;">Total</td>
        <td style="padding: 6px 0; text-align: right; font-weight: 800;">${data.totalFormatted}</td>
      </tr>
    </table>

    <p style="margin-top: 16px; font-size: 14px; color: #3f3f46;">¡Que aproveche! 🍽️</p>

    <p style="margin-top: 20px; font-size: 12px; color: #a1a1aa; text-align: center;">
      BuenBocado — Ofertas exclusivas de restaurantes cerca de ti
    </p>
  </div>
</body>
</html>`;

  return { subject, html };
}
