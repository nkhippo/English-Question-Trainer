import { STEPS } from '../constants/steps.js';
import { getScenePoolText } from '../constants/scenePool.js';
import { getCoreTensesText } from '../constants/coreTenses.js';
import { SYSTEM_PROMPT } from './shared.js';

function buildStepDefs(selectedSteps) {
  return selectedSteps
    .sort((a, b) => a - b)
    .map((n) => {
      const s = STEPS[n];
      const gaps = s.gapCandidates.join(' / ');
      const extra = s.requireAnswerSentence ? '（answerSentence必須）' : '';
      return `STEP ${n}: ${s.name} — ${s.desc}。targetGap候補: ${gaps}${extra}`;
    })
    .join('\n');
}

/**
 * @param {{ steps: number[], count?: number }} params
 */
export function buildGeneratePrompt({ steps, count = 5 }) {
  const stepList = [...steps].sort((a, b) => a - b).join(', ');
  const stepDefs = buildStepDefs(steps);
  const scenePool = getScenePoolText();
  const tenses = getCoreTensesText();

  const user = `次の条件で疑問文ドリルを ${count} 問つくってください。

- 対象STEP: ${stepList}
- STEP定義:
${stepDefs}
- 使用してよいシーン（彩り・話題は固定しない／毎問ランダムに1つ選ぶ）:
${scenePool}
- 時制は以下の核5時制から各問に割り当てて散らす:
${tenses}
- 各問に必ず targetGap を設定。when/where/why/how は answerSense も設定
- STEP4（副詞wh）の問題は answerSentence（模範の答え文）も付ける
- 各問の step は対象STEP集合から1つを割り当てる（総合モードでは完全ランダム）

返却形式（JSONのみ、${count}要素の配列。各要素のスキーマは以下と同一）:
[
  {
    "id": "...", "step": 0, "sceneTag": "...", "functionTag": "...",
    "jp": "...", "targetGap": "...", "answerSense": null,
    "en": "...", "nuance": "...", "thread": "...", "answerSentence": null,
    "parts": [ { "role": "X|V|Y|Z", "text": "...", "note": "..." } ],
    "distractors": [
      { "label": "誤答パターン名", "words": ["誤答を誘う", "単語"], "reason": "模範解答で使わない理由（平易な日本語）" }
    ]
  }
]

distractors ルール（各問ちょうど2つ）:
- 学習者がそのSTEPで陥りやすい**概念上の誤り**を誘発する単語セットを2パターン用意する
- words は模範解答 en に含まれない単語のみ。1パターンあたり1語以上（語順の誤りを誘うなら複数語可）
- 名詞の単数/複数の取り違え、スペルミス、時制の活用ミスなど、疑問文の組み立てとは無関係な誤答は**禁止**
- 例（STEP5 限定詞型）: What を混ぜる（which↔what の取り違え）／ 例（間接疑問）: 従属節に did を混ぜる
- reason には「なぜ模範解答では使わないか」を初学者向けに1〜2文で書く

nuance / note ルール:
- 模範解答がなぜその形になるかを 1〜2文で。語順・時制（どの助動詞を前に出したか／主語をたずねるwhでは助動詞を前に出さない 等）の該当点に触れる
- why/how/when/where は answerSense（原因/目的・手段/様態・時点/節 等）にも1語触れる
- **nuance・note には独自用語『糸/糸1/糸2』『X/Y/Z/V』を使わず、平易な日本語で書く**（例: ×「糸1を解除し」→ ○「助動詞を前に出さず、ふつうの語順にして」）`;

  return { system: SYSTEM_PROMPT, user };
}
