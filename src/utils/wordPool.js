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

/**
 * @param {string} en
 * @param {Distractor[]} distractors
 * @returns {PoolEntry[]}
 */
export function buildWordPool(en, distractors = []) {
  const answerTokens = tokenizeEnglish(en);
  const entries = [];
  let idx = 0;

  for (const text of answerTokens) {
    entries.push({ key: `a${idx}`, text, source: 'answer' });
    idx += 1;
  }

  distractors.forEach((dist, dIdx) => {
    for (const text of dist.words || []) {
      if (!text) continue;
      entries.push({ key: `d${dIdx}-${idx}`, text, source: `distractor-${dIdx}` });
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
  return selectedKeys.map((k) => map.get(k)).filter(Boolean).join(' ');
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
        label: '主語whへのdo挿入',
        words: ['Do', 'does'],
        reason:
          '主語をたずねる疑問文では do/does/did を挿入しません。Who/What の直後に本動詞が続く形になります。',
      },
    ];
  }

  if (step === 6 || targetGap === '従属節gap' || targetGap === '疑問詞+to不定詞') {
    return [
      {
        label: '従属節内の助動詞前置',
        words: ['did', 'do'],
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
      label: 'be動詞があるのにdo挿入',
      words: ['Do', 'does'],
      reason:
        '本動詞が be のときは be を主語の前に出します。一般動詞用の do/does は使いません（×Do you are…）。',
    },
    {
      label: '既存助動詞があるのにdo挿入',
      words: ['Did'],
      reason:
        'have/will/can など助動詞がすでにあるときは、それを前に出します。さらに do/did を足すのは二重挿入の誤りです（×Do you can…）。',
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
  } else {
    distractors = distractors.slice(0, 2);
  }
  const wordPool = buildWordPool(en, distractors);
  return { distractors, wordPool };
}
