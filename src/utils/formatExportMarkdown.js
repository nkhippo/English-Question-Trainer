import { STEPS } from '../constants/steps.js';
import { normalizePart } from './parts.js';
import { keysToSentence } from './wordPool.js';

// 内部コード → 平易表記（§5-3）。表示・MDには独自用語を出さない。
const GAP_PLAIN = {
  yesno: '「はい/いいえ」で答える',
  subject: '「誰が・何が」（主語）をたずねる',
  object: '「何を」（目的語）をたずねる',
  complement: '「どんな状態か」（補語）をたずねる',
  when: '「いつ」をたずねる',
  where: '「どこで」をたずねる',
  why: '「なぜ／何のために」をたずねる',
  how: '「どうやって」をたずねる',
  'which+名詞': '「どの〜」をたずねる',
  'what+名詞': '「何の〜」をたずねる',
  'whose+名詞': '「誰の〜」をたずねる',
  前置詞残留: '前置詞で終わる疑問文',
  alternative: '「A か B か」を選ばせる',
  negative: '否定の確認をする',
  従属節gap: '文の中に疑問を埋め込む',
  '疑問詞+to不定詞': '「どうすべきか」を埋め込む',
};

const ROLE_PLAIN = { X: '名詞', V: '動詞', Y: '名詞修飾', Z: '副詞' };

function plainGap(gap) {
  return GAP_PLAIN[gap] || gap || '—';
}

function stripJargon(text) {
  // 念のための保険：万一モデル出力に独自用語が残っても表示前に平易化する
  return String(text)
    .replace(/<[^>]+>/g, '')
    .replace(/糸1\s*\+\s*糸2/g, '助動詞を前に出し疑問詞を文頭へ')
    .replace(/糸1解除/g, '助動詞を前に出さない')
    .replace(/糸1/g, '助動詞を前に出す操作')
    .replace(/糸2/g, '疑問詞を文頭に動かす操作')
    .trim();
}

function partsPlainLines(parts) {
  return (parts || [])
    .map(normalizePart)
    .filter(Boolean)
    .map((p) => `  ・${ROLE_PLAIN[p.role] || '語句'}: ${p.text}（${stripJargon(p.note) || '—'}）`)
    .join('\n');
}

function distractorLines(distractors) {
  if (!distractors?.length) return '';
  const lines = distractors
    .map((d, i) => `  ${i + 1}. ${d.label}（${d.words.join(' ')}）— ${d.reason}`)
    .join('\n');
  return `\n- 単語プールの誤答誘導語（模範解答で使わない理由）:\n${lines}`;
}

function filenameStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/**
 * 1問ぶんの「貼付プロンプト形式」MDを生成する（②）。
 * Projects に貼るだけで ①添削 ②模範解答が正しい理由 ③その他の表現 が返る。
 * @param {object} item
 * @param {string[]} selectedKeys
 */
export function formatQuestionMarkdown(item, selectedKeys) {
  const stepInfo = STEPS[item.step];
  const pool = item.wordPool || [];
  const mine = keysToSentence(pool, selectedKeys).trim() || '（未入力）';
  const reply = item.answerSentence
    ? item.answerSentence
    : '（この問題に回答文はありません）';

  const markdown = `# 疑問文トレーナー 添削依頼（1問）

あなたは英語教育の専門家です。下の1問について、日本語で次の3点を解説してください。

1. **私の回答の添削** — 文の組み立て方（語順・時制・助動詞の有無・疑問詞の使い方）に沿って、正しい点と誤っている点を具体的に。誤りは「何が」「なぜ」「正しくはどうするか」をセットで。
2. **模範解答がなぜ正しいのか** — 語順・時制・表現の選択根拠を、初学者にも分かる言葉で。私の回答との違いにも触れる。
3. **その他の表現方法** — 同じ意味をより自然に言う別の言い方や、場面で使える言い換えがあれば。

---

## 出題
${item.jp}

## 私の回答
${mine}

## 模範解答
- 質問文: ${item.en}
- 回答文: ${reply}

## 参考（解説の手がかり）
- 出題のねらい: ${plainGap(item.targetGap)}
- 模範解答のポイント: ${stripJargon(item.nuance || '') || '—'}
- 文の組み立て:
${partsPlainLines(item.parts) || '  —'}
${distractorLines(item.distractors)}
`;

  return {
    markdown,
    filename: `qt_step${item.step}_${item.id}_${filenameStamp()}.md`,
    label: `STEP${item.step}・${stepInfo?.name ?? ''}`,
  };
}
