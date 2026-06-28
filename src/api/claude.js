import { buildGeneratePrompt } from '../prompts/generate.js';
import { validateItems } from '../utils/validateItems.js';
import { generateMockBatch } from '../utils/mockItems.js';
import { QUESTIONS_PER_SESSION } from '../constants/steps.js';

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 8192;
const PROXY_URL = import.meta.env.VITE_GAS_PROXY_URL || '';

export { QUESTIONS_PER_SESSION };

function sanitizeJsonText(text) {
  return text
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```/g, '')
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'");
}

function extractJsonArray(text) {
  const cleaned = sanitizeJsonText(text);
  const start = cleaned.indexOf('[');
  if (start === -1) throw new Error('レスポンスからJSON配列を抽出できませんでした');

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }

  throw new Error('JSON配列が途中で切れています');
}

function parseJsonArray(text) {
  const json = extractJsonArray(text);
  const candidates = [json, json.replace(/,\s*([\]}])/g, '$1')];
  let lastError;
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error('JSONの解析に失敗しました');
}

async function callProxy(system, userMessage) {
  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '[' },
    ],
  };

  // application/json だとブラウザが OPTIONS プリフライトを送り、GAS が CORS ヘッダを返せずブロックされる。
  // text/plain は「simple request」となりプリフライトを回避できる（GAS 定番ワークアラウンド）。
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '';
  return '[' + text;
}

async function fetchBatch(steps, count) {
  const { system, user } = buildGeneratePrompt({ steps, count });
  const raw = await callProxy(system, user);
  return parseJsonArray(raw);
}

/**
 * @param {{ steps: number[], count?: number }} params
 */
export async function generateBatch({ steps, count = QUESTIONS_PER_SESSION }) {
  if (!PROXY_URL) {
    console.warn('[generateBatch] VITE_GAS_PROXY_URL 未設定 — モックデータを使用');
    return generateMockBatch({ steps, count });
  }

  let items = [];
  let invalidCount = 0;

  try {
    const raw = await fetchBatch(steps, count);
    const result = validateItems(raw, steps);
    items = result.valid;
    invalidCount = result.invalidCount;
  } catch (error) {
    console.error('[generateBatch]', error);
    throw error;
  }

  if (items.length < count) {
    const need = count - items.length;
    try {
      const retryRaw = await fetchBatch(steps, need);
      const retry = validateItems(retryRaw, steps);
      items = [...items, ...retry.valid.slice(0, need)];
      invalidCount += retry.invalidCount;
    } catch (error) {
      console.warn('[generateBatch] 再要求失敗', error);
    }
  }

  // 実API利用時はモックで補完しない（瞬発訓練の素材にサンプルが紛れるのを防ぐ）。
  // 不足したぶんは実問のみを返し、不足は呼び出し側（App）が表面化する。
  return items.map((item, i) => ({ ...item, id: `q${i + 1}` }));
}

export function isUsingMock() {
  return !PROXY_URL;
}
