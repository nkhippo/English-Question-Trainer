import { ROLES } from '../constants/roles.js';

const VALID_ROLES = new Set(['X', 'V', 'Y', 'Z']);

/** @param {string} text */
function collapseSpaces(text) {
  return text.replace(/\s+/g, ' ').trim();
}

/** @param {{ role?: string, r?: string, text?: string, t?: string, note?: string, n?: string, inner?: unknown[] }} part */
export function normalizePart(part) {
  if (!part || typeof part !== 'object') return null;

  const role = String(part.role ?? part.r ?? 'X').toUpperCase();
  const text = collapseSpaces(String(part.text ?? part.t ?? ''));
  if (!text) return null;

  return {
    role: VALID_ROLES.has(role) ? role : 'X',
    text,
    note: typeof part.note === 'string' ? part.note : (typeof part.n === 'string' ? part.n : ''),
  };
}

export function roleStyle(r) {
  return ROLES[r?.toUpperCase()] ?? ROLES.X;
}

/** @param {ReturnType<typeof normalizePart>[]} parts */
export function formatPartsLine(parts) {
  return (parts ?? [])
    .filter(Boolean)
    .map((p) => `[${p.role}]${p.text}（${p.note || '—'}）`)
    .join(' / ');
}
