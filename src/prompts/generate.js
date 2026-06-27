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
      return `STEP ${n}: ${s.name} — ${s.desc}。糸: ${s.thread}。targetGap候補: ${gaps}${extra}`;
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
    "parts": [ { "role": "X|V|Y|Z", "text": "...", "note": "..." } ]
  }
]

nuance ルール:
- 模範解答がなぜその形になるかを 1〜2文で。構造分解・語順・時制（どの助動詞が前に出たか／主語whで糸1を使わない 等）のうち該当点に触れる
- why/how/when/where は answerSense（原因/目的・手段/様態・時点/節 等）にも1語触れる`;

  return { system: SYSTEM_PROMPT, user };
}
