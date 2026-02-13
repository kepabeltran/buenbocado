/**
 * order-hooks.ts — Lógica post-pedido (notificaciones)
 *
 * Se llama desde los endpoints de crear pedido y marcar entregado.
 */
import type { PrismaClient } from "@prisma/client";
import { sendEmail, orderConfirmationEmail, orderDeliveredEmail } from "./notifications.js";

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function formatDateTime(date: Date) {
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Se llama después de crear un pedido nuevo
 */
export async function onOrderCreated(prisma: PrismaClient, orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        menu: {
          include: {
            restaurant: { select: { name: true, address: true } },
          },
        },
      },
    });

    if (!order || !order.menu) return;

    const emailData = orderConfirmationEmail({
      customerName: order.customerName,
      code: order.code,
      menuTitle: order.menu.title,
      restaurantName: order.menu.restaurant.name,
      restaurantAddress: order.menu.restaurant.address,
      totalFormatted: formatMoney(order.totalCents ?? order.menu.priceCents),
      availableTo: formatDateTime(order.menu.availableTo),
    });

    // Enviar email (no bloquea, es fire-and-forget)
    sendEmail({
      to: order.customerEmail,
      subject: emailData.subject,
      html: emailData.html,
    }).catch((err) => {
      console.error("[ORDER_HOOK] Error enviando email de confirmación:", err);
    });
  } catch (err) {
    console.error("[ORDER_HOOK] Error en onOrderCreated:", err);
  }
}

/**
 * Se llama después de marcar un pedido como entregado
 */
export async function onOrderDelivered(prisma: PrismaClient, orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        menu: {
          include: {
            restaurant: { select: { name: true } },
          },
        },
      },
    });

    if (!order || !order.menu) return;

    const emailData = orderDeliveredEmail({
      customerName: order.customerName,
      menuTitle: order.menu.title,
      restaurantName: order.menu.restaurant.name,
      totalFormatted: formatMoney(order.totalCents ?? order.menu.priceCents),
    });

    sendEmail({
      to: order.customerEmail,
      subject: emailData.subject,
      html: emailData.html,
    }).catch((err) => {
      console.error("[ORDER_HOOK] Error enviando email de entrega:", err);
    });
  } catch (err) {
    console.error("[ORDER_HOOK] Error en onOrderDelivered:", err);
  }
}
