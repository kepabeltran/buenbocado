"use client";

const STORAGE_KEY = "bb_offer_caps_v1";

type CapsMap = Record<string, number>; // key = offerId|YYYY-MM-DD|windowId

function load(): CapsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function save(map: CapsMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export function makeCapKey(offerId: string, dayYMD: string, windowId: string) {
  return `${offerId}|${dayYMD}|${windowId}`;
}

export function getRemainingCapacity(
  offerId: string,
  dayYMD: string,
  windowId: string,
  baseCapacity: number,
): number {
  try {
    const map = load();
    const k = makeCapKey(offerId, dayYMD, windowId);
    const v = map[k];
    return typeof v === "number" ? v : baseCapacity;
  } catch {
    return baseCapacity;
  }
}

export function reserveOne(
  offerId: string,
  dayYMD: string,
  windowId: string,
  baseCapacity: number,
): { ok: boolean; remaining: number } {
  const map = load();
  const k = makeCapKey(offerId, dayYMD, windowId);
  const current = typeof map[k] === "number" ? map[k] : baseCapacity;

  if (current <= 0) return { ok: false, remaining: 0 };

  const next = current - 1;
  map[k] = next;
  save(map);

  return { ok: true, remaining: next };
}
