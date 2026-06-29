/**
 * 模範解答をトークン化し、誤答誘導語を混ぜた単語プールを構築する。
 */

/**
 * @param {string} sentence
 * @returns {string[]}
 */
export function tokenizeEnglish(sentence) {
  const trimmed = String(sentence || '').trim();
  if (!trimmed) return [];
  return trimmed.match(/[\w']+|[?,;:.!]+/g) || [];
}

/**
 * @typedef {{ label: string, words: string[], reason: string }} Distractor
 * @typedef {{ key: string, text: string, source: string }} PoolEntry
 */

function isWordToken(text) {
  return /[a-zA-Z]/.test(text);
}

function poolKey(text) {
  return isWordToken(text) ? text.toLowerCase() : text;
}

/** プール表示用（小文字） */
export function poolDisplayText(text) {
  if (!isWordToken(text)) return text;
  return text.toLowerCase();
}

/** 組み立て英文での1語表示（先頭語のみ先頭大文字） */
export function tokenForSentence(text, capitalizeAsFirst) {
  if (!isWordToken(text)) return text;
  const lower = text.toLowerCase();
  if (capitalizeAsFirst) {
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return lower;
}

/**
 * @param {string} en
 * @param {Distractor[]} distractors
 * @returns {PoolEntry[]}
 */
export function buildWordPool(en, distractors = []) {
  const answerTokens = tokenizeEnglish(en);
  const entries = [];
  let idx = 0;

  for (const raw of answerTokens) {
    entries.push({
      key: `a${idx}`,
      text: poolDisplayText(raw),
      source: 'answer',
    });
    idx += 1;
  }

  const inPoolKeys = new Set(entries.map((e) => poolKey(e.text)));

  distractors.forEach((dist, dIdx) => {
    for (const raw of dist.words || []) {
      if (!raw) continue;
      const key = poolKey(raw);
      if (inPoolKeys.has(key)) continue;
      inPoolKeys.add(key);
      entries.push({
        key: `d${dIdx}-${idx}`,
        text: poolDisplayText(raw),
        source: `distractor-${dIdx}`,
      });
      idx += 1;
    }
  });

  return [...entries].sort((a, b) =>
    a.text.localeCompare(b.text, 'en', { sensitivity: 'base' }),
  );
}

/**
 * @param {PoolEntry[]} pool
 * @param {string[]} selectedKeys
 * @returns {string}
 */
export function keysToSentence(pool, selectedKeys) {
  if (!selectedKeys?.length) return '';
  const map = new Map(pool.map((e) => [e.key, e.text]));
  const tokens = selectedKeys.map((k) => map.get(k)).filter(Boolean);
  let capitalizeNext = true;
  return tokens
    .map((t) => {
      if (!isWordToken(t)) return t;
      const out = tokenForSentence(t, capitalizeNext);
      capitalizeNext = false;
      return out;
    })
    .join(' ');
}

/** 正誤判定用に英文を正規化する */
export function normalizeAnswerForCompare(sentence) {
  return String(sentence || '')
    .trim()
    .toLowerCase()
    .replace(/\s+([?!.,;:])/g, '$1')
    .replace(/\s+/g, ' ');
}

/**
 * @param {PoolEntry[]} pool
 * @param {string[]} selectedKeys
 * @param {string} modelEn
 * @returns {boolean}
 */
export function isAnswerCorrect(pool, selectedKeys, modelEn) {
  if (!selectedKeys?.length) return false;
  const attempt = keysToSentence(pool, selectedKeys).trim();
  if (!attempt) return false;
  return normalizeAnswerForCompare(attempt) === normalizeAnswerForCompare(modelEn);
}

/**
 * @param {PoolEntry[]} pool
 * @param {string[]} selectedKeys
 * @returns {Set<string>}
 */
export function usedDistractorSources(pool, selectedKeys) {
  const keySet = new Set(selectedKeys || []);
  const sources = new Set();
  for (const entry of pool) {
    if (keySet.has(entry.key) && entry.source.startsWith('distractor-')) {
      sources.add(entry.source);
    }
  }
  return sources;
}

/**
 * @param {unknown} raw
 * @returns {Distractor[]}
 */
export function normalizeDistractors(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d) => {
      if (!d || typeof d !== 'object') return null;
      const label = typeof d.label === 'string' ? d.label.trim() : '';
      const reason = typeof d.reason === 'string' ? d.reason.trim() : '';
      const words = Array.isArray(d.words)
        ? d.words.map((w) => String(w).trim()).filter(Boolean)
        : [];
      if (!label || !reason || words.length === 0) return null;
      return { label, words, reason };
    })
    .filter(Boolean);
}

const AUXILIARIES = new Set([
  'do', 'does', 'did', 'is', 'are', 'am', 'was', 'were', 'been', 'being',
  'have', 'has', 'had', 'will', 'would', 'shall', 'should', 'can', 'could',
  'may', 'might', 'must',
]);

const TENSE_TOPIC_RE =
  /時制|過去形|現在形|未来|完了形|完了|三単現|活用|原形|do挿入|助動詞|be動詞|be\+ing|進行形|過去(?![問句])|現在|ate|混入|誤用/i;

const NON_TENSE_TOPIC_RE =
  /語順|前置詞|引き連れ|限定詞|which|what|whose|間接疑問|従属節|平叙|選択|否定|原因|目的|手段|状態|疑問詞|wh/i;

const IRREGULAR_PAST = new Set([
  'ate', 'went', 'bought', 'chose', 'cooked', 'read', 'made', 'took', 'gave',
  'saw', 'came', 'got', 'left', 'spoke', 'told', 'found', 'thought', 'knew',
]);

function normalizeToken(word) {
  return String(word).toLowerCase().replace(/[^a-z']/g, '');
}

function isLikelyPastTenseVerb(word) {
  const w = normalizeToken(word);
  if (!w || AUXILIARIES.has(w)) return false;
  if (IRREGULAR_PAST.has(w)) return true;
  return /ed$/.test(w) && w.length > 3;
}

const DO_DOES_PERSON_TOPIC_RE =
  /三人称|三単現|do\s*[と↔／/]|does\s*[と↔／/]|[と↔／/]\s*do|[と↔／/]\s*does|人称|does誤用|doを使う|doesを使う|Do と goes|Do と leaves/i;

function isDoDoesPersonDistractor(distractor, answerTokens) {
  const label = distractor.label || '';
  const reason = distractor.reason || '';
  if (DO_DOES_PERSON_TOPIC_RE.test(label) || DO_DOES_PERSON_TOPIC_RE.test(reason)) {
    return true;
  }

  const words = distractor.words.map(normalizeToken).filter(Boolean);
  if (words.some((w) => w === 'does')) return true;

  const answerSet = new Set(answerTokens.map(normalizeToken));
  const distractorHasDo = words.includes('do');
  const answerHasDoes = answerSet.has('does');
  const answerHasDo = answerSet.has('do');

  // 模範が does のとき do を混ぜる（またはその逆）は人称の取り違え
  if (distractorHasDo && answerHasDoes && !answerHasDo) return true;
  if (words.includes('does') && answerHasDo && !answerHasDoes) return true;

  return false;
}

/**
 * @param {Distractor} distractor
 * @param {string[]} answerTokens
 */
export function isTenseRelatedDistractor(distractor, answerTokens) {
  if (isDoDoesPersonDistractor(distractor, answerTokens)) return false;

  const label = distractor.label || '';
  const reason = distractor.reason || '';

  if (NON_TENSE_TOPIC_RE.test(label) && !TENSE_TOPIC_RE.test(label)) return false;
  if (/語順|平叙/.test(reason) && !TENSE_TOPIC_RE.test(label)) return false;
  if (TENSE_TOPIC_RE.test(label) || TENSE_TOPIC_RE.test(reason)) return true;

  const answerSet = new Set(answerTokens.map(normalizeToken));
  const words = distractor.words.map(normalizeToken).filter(Boolean);

  if (words.some((w) => isLikelyPastTenseVerb(w) && !answerSet.has(w))) return true;

  const tenseMarkers = words.filter((w) => AUXILIARIES.has(w));
  if (tenseMarkers.length === 0) return false;

  // 助動詞のみ、または助動詞＋過去形動詞の組み合わせは時制誘導とみなす
  return words.every((w) => AUXILIARIES.has(w) || isLikelyPastTenseVerb(w));
}

/**
 * 時制に関する誘導は1問あたり最大1つに制限する。
 * @param {Distractor[]} distractors
 * @param {{ step: number, targetGap: string }} meta
 * @param {string} en
 * @returns {Distractor[]}
 */
function enforceDistractorRules(distractors, meta, en) {
  const tokens = tokenizeEnglish(en);
  let list = distractors.filter((d) => !isDoDoesPersonDistractor(d, tokens));

  let tenseKept = false;
  list = list.filter((d) => {
    if (!isTenseRelatedDistractor(d, tokens)) return true;
    if (!tenseKept) {
      tenseKept = true;
      return true;
    }
    return false;
  });

  const fallbacks = fallbackDistractors({ ...meta, en });
  for (const candidate of fallbacks) {
    if (list.length >= 2) break;
    if (list.some((d) => d.label === candidate.label)) continue;
    if (isDoDoesPersonDistractor(candidate, tokens)) continue;
    const wouldBeSecondTense =
      isTenseRelatedDistractor(candidate, tokens) &&
      list.some((d) => isTenseRelatedDistractor(d, tokens));
    if (wouldBeSecondTense) continue;
    list.push(candidate);
  }

  return list.slice(0, 2);
}

/**
 * AIが distractors を返さなかった場合のフォールバック（STEP別の概念誤答）。
 * @param {{ step: number, targetGap: string, en: string }} item
 * @returns {Distractor[]}
 */
export function fallbackDistractors(item) {
  const { step, targetGap } = item;

  if (step === 2 || targetGap === 'subject') {
    return [
      {
        label: '主語whへの助動詞前置',
        words: ['Did'],
        reason:
          '主語をたずねる疑問文では助動詞を前に出さず、ふつうの語順のままにします。時制は本動詞の活用に乗せます（×Did who…）。',
      },
      {
        label: '疑問詞の位置の取り違え',
        words: ['cooked', 'Who'],
        reason:
          '主語を問う wh は文頭に来ます。Who の直後に本動詞が続く語順を崩すと疑問文になりません。',
      },
    ];
  }

  if (step === 6 || targetGap === '従属節gap' || targetGap === '疑問詞+to不定詞') {
    return [
      {
        label: '従属節内の助動詞前置',
        words: ['did'],
        reason:
          '間接疑問の従属節では助動詞を前に出さず、平叙文と同じ語順にします（×…where did the station is）。',
      },
      {
        label: '従属節を直接疑問の語順にする',
        words: ['is', 'Where'],
        reason:
          '埋め込まれた疑問節は「疑問詞＋主語＋動詞」の平叙語順です。文頭に疑問詞を出して助動詞を前に出すのは直接疑問の形です。',
      },
    ];
  }

  if (targetGap === '前置詞残留') {
    return [
      {
        label: '前置詞の引き連れ（フォーマル）',
        words: ['With', 'whom'],
        reason:
          '口語では前置詞を文末に残すのが自然です（Who did you go with?）。With whom はフォーマルな引き連れで、この訓練の模範とは異なります。',
      },
      {
        label: '前置詞を疑問詞の前に出す',
        words: ['with', 'Who'],
        reason:
          '前置詞残留では疑問詞 Who が文頭に来て、前置詞 with は文末に残します。前置詞を文頭に出すのは別の構文です。',
      },
    ];
  }

  if (targetGap === 'which+名詞' || targetGap === 'what+名詞' || targetGap === 'whose+名詞') {
    return [
      {
        label: '限定詞の取り違え（which↔what）',
        words: ['What'],
        reason:
          '日本語が「どの〜」のときは特定の中から選ぶ Which を使います。What は不特定・種類を問う場合が多く、出題の意図とずれます。',
      },
      {
        label: '疑問詞だけ前に出して名詞を後ろに置く',
        words: ['Which', 'did'],
        reason:
          '限定詞型では Which と名詞をセットで文頭に出します（Which book…）。疑問詞だけ前に出して名詞を後ろに置くのは語順の誤りです。',
      },
    ];
  }

  if (step === 7 && targetGap === 'negative') {
    return [
      {
        label: '平叙の否定をそのまま疑問にする',
        words: ["don't", 'eat'],
        reason:
          '否定疑問では助動詞と not を主語の前にまとめて出します（Don\'t you eat…?）。平叙の否定語順のままでは疑問文になりません。',
      },
      {
        label: 'Yes/No疑問にdoだけ挿入',
        words: ['Do', 'not'],
        reason:
          '否定疑問は Don\'t you…? のように not を助動詞と一体で前に出します。Do と not を別々に並べるのは別の構文です。',
      },
    ];
  }

  return [
    {
      label: 'be動詞があるのに一般動詞の語順',
      words: ['Is', 'are'],
      reason:
        '本動詞が be のときは be を主語の前に出します。一般動詞と同じ組み立てにはしません（×Is you happy? の取り違え）。',
    },
    {
      label: '疑問詞の位置の取り違え',
      words: ['you', 'Where'],
      reason:
        '副詞的な疑問詞は文頭に出します（Where did you…）。where を主語の後に置くのは平叙文や間接疑問の語順です。',
    },
  ];
}

/**
 * @param {string} en
 * @param {unknown} rawDistractors
 * @param {{ step: number, targetGap: string }} meta
 * @returns {{ distractors: Distractor[], wordPool: PoolEntry[] }}
 */
export function assembleWordPoolData(en, rawDistractors, meta) {
  let distractors = normalizeDistractors(rawDistractors);
  if (distractors.length < 2) {
    distractors = fallbackDistractors({ ...meta, en });
  }
  distractors = enforceDistractorRules(distractors, meta, en);
  const wordPool = buildWordPool(en, distractors);
  return { distractors, wordPool };
}
