import { assembleWordPoolData } from './wordPool.js';

const WH_WORDS = /\b(who|whom|what|which|whose|when|where|why|how)\b/gi;
const AUX_OR_BE = /^(do|does|did|is|are|am|was|were|have|has|had|will|would|can|could|shall|should|may|might|must)\b/i;
// do挿入が同一節内で be形・法助動詞を直接従える誤用（×Do you can / ×Does she is going）だけを検出する。
// 主語は最大2語まで挟める。have/has/had は本動詞用法（Did you have lunch?）が正当なので含めない。
// これにより従属節の be/助動詞（Do you know where the station is?）を誤検出しない。
const DO_PLUS_FINITE_AUX = /\b(do|does|did)\s+(?:\w+\s+){0,2}?(is|are|am|was|were|been|being|can|could|will|would|shall|should|may|might|must)\b/i;
const SENSE_GAPS = new Set(['when', 'where', 'why', 'how']);

function countWhWords(text) {
  const matches = text.match(WH_WORDS);
  return matches ? matches.length : 0;
}

function hasDoWithAux(en) {
  return DO_PLUS_FINITE_AUX.test(en);
}

function subjectWhHasThread1(en, targetGap) {
  if (targetGap !== 'subject') return false;
  const trimmed = en.trim();
  const whMatch = trimmed.match(/^(who|whom|what|which|whose)\b/i);
  if (!whMatch) return false;
  const afterWh = trimmed.slice(whMatch[0].length).trim();
  return AUX_OR_BE.test(afterWh);
}

function indirectClauseHasThread1(en) {
  const clauses = en.split(/\b(?:that|if|whether)\b/i);
  if (clauses.length < 2) {
    const embedded = en.match(/\b(?:know|tell|wonder|ask|explain|remember|understand|see)\b[^?]*?\b(who|whom|what|which|whose|when|where|why|how)\s+(do|does|did|is|are|was|were|have|has|had|will|can|could)\b/i);
    return Boolean(embedded);
  }
  for (let i = 1; i < clauses.length; i++) {
    const clause = clauses[i];
    if (/\b(who|whom|what|which|whose|when|where|why|how)\s+(do|does|did|is|are|was|were|have|has|had|will|can|could)\b/i.test(clause)) {
      return true;
    }
  }
  return false;
}

function ensureQuestionMark(en) {
  const trimmed = en.trim();
  return trimmed.endsWith('?') ? trimmed : `${trimmed}?`;
}

/**
 * @param {unknown[]} items
 * @param {number[]} selectedSteps
 */
export function validateItems(items, selectedSteps) {
  const valid = [];
  let invalidCount = 0;
  const stepSet = new Set(selectedSteps);

  for (const raw of items) {
    if (!raw || typeof raw !== 'object') {
      invalidCount++;
      continue;
    }

    const item = /** @type {Record<string, unknown>} */ (raw);
    let en = typeof item.en === 'string' ? item.en.trim() : '';
    const step = Number(item.step);
    const targetGap = typeof item.targetGap === 'string' ? item.targetGap : '';
    const answerSense = item.answerSense;

    if (!stepSet.has(step)) {
      invalidCount++;
      continue;
    }
    if (!targetGap) {
      invalidCount++;
      continue;
    }
    if (SENSE_GAPS.has(targetGap) && !answerSense) {
      invalidCount++;
      continue;
    }
    if (!en) {
      invalidCount++;
      continue;
    }

    // 1文1疑問詞。直接疑問は1つ、間接疑問(STEP6)のみ従属節whを含め2つまで許容。
    const whLimit = step === 6 ? 2 : 1;
    if (countWhWords(en) > whLimit) {
      invalidCount++;
      continue;
    }
    if (hasDoWithAux(en)) {
      invalidCount++;
      continue;
    }
    if (subjectWhHasThread1(en, targetGap)) {
      invalidCount++;
      continue;
    }
    if (step === 6 && indirectClauseHasThread1(en)) {
      invalidCount++;
      continue;
    }

    en = ensureQuestionMark(en);

    const { distractors, wordPool } = assembleWordPoolData(en, item.distractors, {
      step,
      targetGap,
    });

    valid.push({
      ...item,
      en,
      id: typeof item.id === 'string' ? item.id : `q${valid.length + 1}`,
      step,
      targetGap,
      jp: typeof item.jp === 'string' ? item.jp : '',
      nuance: typeof item.nuance === 'string' ? item.nuance : '',
      thread: typeof item.thread === 'string' ? item.thread : '',
      sceneTag: typeof item.sceneTag === 'string' ? item.sceneTag : '',
      functionTag: typeof item.functionTag === 'string' ? item.functionTag : '',
      answerSense: answerSense ?? null,
      answerSentence: typeof item.answerSentence === 'string' ? item.answerSentence : null,
      parts: Array.isArray(item.parts) ? item.parts : [],
      distractors,
      wordPool,
    });
  }

  return { valid, invalidCount };
}
