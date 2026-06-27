export const STEPS = {
  1: {
    name: 'Yes/No 疑問文',
    desc: '糸1のみ・3機構を回す',
    thread: '糸1',
    gapCandidates: ['yesno'],
  },
  2: {
    name: 'wh・主語を聞く',
    desc: '糸2のみ・糸1なし',
    thread: '糸2',
    gapCandidates: ['subject'],
  },
  3: {
    name: 'wh・主語以外を聞く',
    desc: '糸1 + 糸2',
    thread: '糸1+糸2',
    gapCandidates: ['object', 'complement', 'when', 'where', 'why', 'how'],
  },
  4: {
    name: '副詞wh ＋ 答え文',
    desc: 'when/where/why/how + 答え',
    thread: '糸1+糸2',
    gapCandidates: ['when', 'where', 'why', 'how'],
    requireAnswerSentence: true,
  },
  5: {
    name: '限定詞型・前置詞残留',
    desc: 'Which book / Who…with?',
    thread: '糸1+糸2',
    gapCandidates: ['which+名詞', 'what+名詞', 'whose+名詞', '前置詞残留'],
  },
  6: {
    name: '間接疑問',
    desc: '糸1解除・二重疑問構造',
    thread: '糸1解除',
    gapCandidates: ['従属節gap', '疑問詞+to不定詞'],
  },
  7: {
    name: '選択・否定疑問',
    desc: "or B? / Don't you…?",
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
