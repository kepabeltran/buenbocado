/**
 * cron.ts — Tareas automáticas periódicas
 *
 * - Cancelar pedidos CREATED o CONFIRMED con más de 2 horas (no-show)
 * - Se ejecuta cada 10 minutos
 */
import type { PrismaClient } from "@prisma/client";

const NO_SHOW_MINUTES = 120; // 2 horas
const CRON_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos

export function startCronJobs(prisma: PrismaClient) {
  console.log("[CRON] Tareas automáticas iniciadas (cada 10 min)");

  async function cancelNoShows() {
    try {
      const cutoff = new Date(Date.now() - NO_SHOW_MINUTES * 60 * 1000);

      const result = await prisma.order.updateMany({
        where: {
          status: { in: ["CREATED", "CONFIRMED"] },
          createdAt: { lt: cutoff },
        },
        data: {
          status: "CANCELLED",
        },
      });

      if (result.count > 0) {
        console.log(`[CRON] ${result.count} pedido(s) cancelado(s) por no-show (>2h sin recoger)`);
      }
    } catch (err) {
      console.error("[CRON] Error cancelando no-shows:", err);
    }
  }

  // Ejecutar al arrancar
  cancelNoShows();

  // Repetir cada 10 minutos
  setInterval(cancelNoShows, CRON_INTERVAL_MS);
}
