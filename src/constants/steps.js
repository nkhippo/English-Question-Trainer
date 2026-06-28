// 操作ベース7 STEP（structure-map §8-1）。表示は平易表記（独自用語を使わない）。
// thread は内部コードとして保持（表示・MDには出さない／§5-3で変換）。

export const STEPS = {
  1: {
    name: 'Yes/No 疑問文',
    desc: '「はい/いいえ」で答える。助動詞を主語の前に出す',
    thread: '糸1',
    gapCandidates: ['yesno'],
  },
  2: {
    name: '主語をたずねる疑問文',
    desc: '「誰が・何が」をたずねる（ふつうの語順のまま）',
    thread: '糸2',
    gapCandidates: ['subject'],
  },
  3: {
    name: '主語以外をたずねる疑問文',
    desc: '「何を・どこで」など。助動詞を前に出し、疑問詞を文頭へ',
    thread: '糸1+糸2',
    gapCandidates: ['object', 'complement', 'when', 'where', 'why', 'how'],
  },
  4: {
    name: '理由・方法・時・場所をたずねる',
    desc: 'why / how / when / where と、その答え方',
    thread: '糸1+糸2',
    gapCandidates: ['when', 'where', 'why', 'how'],
    requireAnswerSentence: true,
  },
  5: {
    name: '「どの〜」や前置詞で終わる疑問文',
    desc: 'Which book … ? / Who … with ?',
    thread: '糸1+糸2',
    gapCandidates: ['which+名詞', 'what+名詞', 'whose+名詞', '前置詞残留'],
  },
  6: {
    name: '間接疑問',
    desc: '文の中に疑問を埋め込む（Do you know where … ?）',
    thread: '糸1解除',
    gapCandidates: ['従属節gap', '疑問詞+to不定詞'],
  },
  7: {
    name: '選択・否定の疑問文',
    desc: "or B? / Don't you … ?",
    thread: '糸1',
    gapCandidates: ['alternative', 'negative'],
  },
};

export const ANSWER_SENSE = {
  why: ['cause', 'purpose'],
  how: ['means', 'manner', 'state', 'degree'],
  when: ['point', 'clause'],
  where: ['point', 'clause'],
};

export const QUESTIONS_PER_SESSION = 5;
