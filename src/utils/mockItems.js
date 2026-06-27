import { pickRandomScene } from '../constants/scenePool.js';
import { STEPS } from '../constants/steps.js';

/** プロトタイプ BANK 由来 — API未設定時のモック生成 */
const BANK = {
  1: [
    { jp: 'あなたは今日キッチンを使いましたか？', targetGap: 'yesno', answerSense: null, thread: '糸1', en: 'Did you use the kitchen today?', nuance: '一般動詞 use・助動詞なし → do挿入（did）。挿入後の本動詞は原形 use。', parts: [{ role: 'V', text: 'Did use', note: 'do挿入・過去・原形' }, { role: 'X', text: 'you', note: '主語' }, { role: 'X', text: 'the kitchen', note: '目的語' }, { role: 'Z', text: 'today', note: '時の副詞' }] },
    { jp: 'この電車は空港に行きますか？', targetGap: 'yesno', answerSense: null, thread: '糸1', en: 'Does this train go to the airport?', nuance: '三人称単数・現在 → does を前出。go は原形のまま。', parts: [{ role: 'V', text: 'Does go', note: 'do挿入・三単現' }, { role: 'X', text: 'this train', note: '主語' }, { role: 'Z', text: 'to the airport', note: '到達点の副詞句' }] },
    { jp: 'あなたはもう昼食を食べましたか？', targetGap: 'yesno', answerSense: null, thread: '糸1', en: 'Have you eaten lunch yet?', nuance: '既存助動詞 have があるので、それを前出（×do）。完了の yet は文末。', parts: [{ role: 'V', text: 'Have eaten', note: '現在完了・have前出' }, { role: 'X', text: 'you', note: '主語' }, { role: 'X', text: 'lunch', note: '目的語' }, { role: 'Z', text: 'yet', note: '完了の副詞' }] },
  ],
  2: [
    { jp: '昨日、誰がこの料理を作ったのですか？', targetGap: 'subject', answerSense: null, thread: '糸2', en: 'Who cooked this dish yesterday?', nuance: '主語を問うwhは糸1なし。時制は裸動詞の活用 cooked に乗る（×did cook）。', parts: [{ role: 'X', text: 'Who', note: '主語を問うwh' }, { role: 'V', text: 'cooked', note: '過去・裸動詞' }, { role: 'X', text: 'this dish', note: '目的語' }, { role: 'Z', text: 'yesterday', note: '時の副詞' }] },
    { jp: '何がそんなに面白いのですか？', targetGap: 'subject', answerSense: null, thread: '糸2', en: 'What is so funny?', nuance: '主語Whatに be が続く。be は本動詞なので語順そのまま、糸1の助動詞挿入なし。', parts: [{ role: 'X', text: 'What', note: '主語を問うwh' }, { role: 'V', text: 'is', note: 'be・現在' }, { role: 'Z', text: 'so funny', note: '補語的な様態' }] },
  ],
  3: [
    { jp: 'あなたは昨日どこでそのカバンを買いましたか？', targetGap: 'where', answerSense: 'point', thread: '糸1+糸2', en: 'Where did you buy the bag yesterday?', nuance: '糸2で Where を前出し、糸1の do挿入(did)。挿入後の本動詞は原形 buy。', parts: [{ role: 'Z', text: 'Where', note: '場所を問うwh' }, { role: 'V', text: 'did buy', note: 'do挿入・原形' }, { role: 'X', text: 'you', note: '主語' }, { role: 'X', text: 'the bag', note: '目的語' }, { role: 'Z', text: 'yesterday', note: '時の副詞' }] },
    { jp: '次のバスはいつ出発しますか？', targetGap: 'when', answerSense: 'point', thread: '糸1+糸2', en: 'When does the next bus leave?', nuance: 'When を前出し、三単現の does を挿入。leave は原形。', parts: [{ role: 'Z', text: 'When', note: '時を問うwh' }, { role: 'V', text: 'does leave', note: 'do挿入・三単現' }, { role: 'X', text: 'the next bus', note: '主語' }] },
  ],
  4: [
    { jp: 'なぜ（何のために）あなたは海外で働くことを選んだのですか？', targetGap: 'why', answerSense: 'purpose', thread: '糸1+糸2', en: 'Why did you choose to work abroad?', nuance: 'why は目的(purpose)を狙う出題。答えは to不定詞で意図を述べる。', answerSentence: 'To find what I really want to do.', parts: [{ role: 'Z', text: 'Why', note: '理由/目的を問うwh' }, { role: 'V', text: 'did choose', note: 'do挿入・原形' }, { role: 'X', text: 'you', note: '主語' }, { role: 'X', text: 'to work abroad', note: '目的語(to不定詞)' }] },
    { jp: '駅まではどうやって行けばいいですか？', targetGap: 'how', answerSense: 'means', thread: '糸1+糸2', en: 'How do I get to the station?', nuance: 'how は手段(means)。道案内の答えは命令文になりやすい。', answerSentence: 'Go straight and turn left at the corner.', parts: [{ role: 'Z', text: 'How', note: '手段を問うwh' }, { role: 'V', text: 'do get', note: 'do挿入・原形' }, { role: 'X', text: 'I', note: '主語' }, { role: 'Z', text: 'to the station', note: '到達点' }] },
  ],
  5: [
    { jp: 'あなたはどの本を先に読みましたか？', targetGap: 'which+名詞', answerSense: null, thread: '糸1+糸2', en: 'Which book did you read first?', nuance: '限定詞型。Which が名詞 book を引き連れ、2語で前出。', parts: [{ role: 'X', text: 'Which book', note: '限定詞型wh(2語)' }, { role: 'V', text: 'did read', note: 'do挿入・原形' }, { role: 'X', text: 'you', note: '主語' }, { role: 'Z', text: 'first', note: '順序の副詞' }] },
    { jp: 'あなたは誰と一緒に行ったのですか？', targetGap: '前置詞残留', answerSense: null, thread: '糸1+糸2', en: 'Who did you go with?', nuance: '口語は前置詞残留。with を元位置に残す（フォーマルは With whom）。', parts: [{ role: 'X', text: 'Who', note: '目的語を問うwh' }, { role: 'V', text: 'did go', note: 'do挿入・原形' }, { role: 'X', text: 'you', note: '主語' }, { role: 'Z', text: 'with', note: '残留した前置詞' }] },
  ],
  6: [
    { jp: '駅がどこにあるか教えてもらえますか？', targetGap: '従属節gap', answerSense: null, thread: '糸1解除', en: 'Could you tell me where the station is?', nuance: '二重疑問構造。主節 Could you に糸1、従属節は糸1解除で平叙語順 where the station is。', parts: [{ role: 'V', text: 'Could tell', note: '主節・糸1' }, { role: 'X', text: 'you / me', note: '主語・間接目的語' }, { role: 'Y', text: 'where the station is', note: '従属節(平叙語順)' }] },
    { jp: 'どうやってそこへ行けばいいか分かりますか？', targetGap: '疑問詞+to不定詞', answerSense: null, thread: '糸1解除', en: 'Do you know how to get there?', nuance: '間接疑問の縮約形。how to get で「行き方」を表し、従属節に糸1なし。', parts: [{ role: 'V', text: 'Do know', note: '主節・do挿入' }, { role: 'X', text: 'you', note: '主語' }, { role: 'X', text: 'how to get there', note: '疑問詞+to不定詞' }] },
  ],
  7: [
    { jp: 'コーヒーと紅茶、どちらになさいますか？', targetGap: 'alternative', answerSense: null, thread: '糸1', en: 'Would you like coffee or tea?', nuance: '選択疑問。Yes/Noの土台に or で選択肢を足す。', parts: [{ role: 'V', text: 'Would like', note: '丁寧な申し出' }, { role: 'X', text: 'you', note: '主語' }, { role: 'X', text: 'coffee or tea', note: '選択肢' }] },
    { jp: 'あなたは夕食を食べないのですか？', targetGap: 'negative', answerSense: null, thread: '糸1', en: "Don't you eat dinner?", nuance: '否定疑問。do挿入 + not を前出。', parts: [{ role: 'V', text: "Don't eat", note: '否定疑問・do挿入' }, { role: 'X', text: 'you', note: '主語' }, { role: 'X', text: 'dinner', note: '目的語' }] },
  ],
};

/**
 * @param {{ steps: number[], count?: number }} params
 */
export function generateMockBatch({ steps, count = 5 }) {
  const pool = [...steps];
  const items = [];

  for (let i = 0; i < count; i++) {
    const step = pool[Math.floor(Math.random() * pool.length)];
    const bank = BANK[step];
    const pick = bank[Math.floor(Math.random() * bank.length)];
    const { sceneTag, functionTag } = pickRandomScene();

    items.push({
      id: `q${i + 1}`,
      step,
      sceneTag,
      functionTag,
      ...pick,
      answerSentence: pick.answerSentence ?? null,
    });
  }

  return items;
}
