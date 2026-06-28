import { pickRandomScene } from '../constants/scenePool.js';
import { STEPS } from '../constants/steps.js';
import { assembleWordPoolData } from './wordPool.js';

/** プロトタイプ BANK 由来 — API未設定時のモック生成 */
const BANK = {
  1: [
    {
      jp: 'あなたは今日キッチンを使いましたか？',
      targetGap: 'yesno',
      answerSense: null,
      thread: '糸1',
      en: 'Did you use the kitchen today?',
      nuance: '一般動詞 use・助動詞なし → do挿入（did）。挿入後の本動詞は原形 use。',
      parts: [
        { role: 'V', text: 'Did use', note: 'do挿入・過去・原形' },
        { role: 'X', text: 'you', note: '主語' },
        { role: 'X', text: 'the kitchen', note: '目的語' },
        { role: 'Z', text: 'today', note: '時の副詞' },
      ],
      distractors: [
        {
          label: 'be動詞があるのにdo挿入',
          words: ['Do', 'are'],
          reason: '本動詞が be のときは be を前に出します。一般動詞用の do は使いません。',
        },
        {
          label: '既存助動詞があるのにdo挿入',
          words: ['Did', 'can'],
          reason: 'can など助動詞があるときはそれを前に出し、さらに did を足しません（×Did you can…）。',
        },
      ],
    },
    {
      jp: 'この電車は空港に行きますか？',
      targetGap: 'yesno',
      answerSense: null,
      thread: '糸1',
      en: 'Does this train go to the airport?',
      nuance: '三人称単数・現在 → does を前出。go は原形のまま。',
      parts: [
        { role: 'V', text: 'Does go', note: 'do挿入・三単現' },
        { role: 'X', text: 'this train', note: '主語' },
        { role: 'Z', text: 'to the airport', note: '到達点の副詞句' },
      ],
      distractors: [
        {
          label: '三単現なのにdoを使う',
          words: ['Do', 'goes'],
          reason: '三人称単数の現在では does を前に出し、本動詞は原形 go のままにします。Do と goes の組み合わせは二重表現です。',
        },
        {
          label: 'be動詞を前に出す',
          words: ['Is', 'going'],
          reason: '本動詞が一般動詞 go なので be+ing ではなく does を使います。be を前に出すのは本動詞が be のときです。',
        },
      ],
    },
    {
      jp: 'あなたはもう昼食を食べましたか？',
      targetGap: 'yesno',
      answerSense: null,
      thread: '糸1',
      en: 'Have you eaten lunch yet?',
      nuance: '既存助動詞 have があるので、それを前出（×do）。完了の yet は文末。',
      parts: [
        { role: 'V', text: 'Have eaten', note: '現在完了・have前出' },
        { role: 'X', text: 'you', note: '主語' },
        { role: 'X', text: 'lunch', note: '目的語' },
        { role: 'Z', text: 'yet', note: '完了の副詞' },
      ],
      distractors: [
        {
          label: '完了形なのにdo挿入',
          words: ['Did', 'have'],
          reason: '現在完了では have を前に出します。did を足して have を原形に戻すのは誤りです。',
        },
        {
          label: '過去形のdo挿入',
          words: ['Do', 'ate'],
          reason: '完了形 Have you eaten…? が正しく、単純過去の Did you ate…? とは時制の組み立てが異なります。',
        },
      ],
    },
  ],
  2: [
    {
      jp: '昨日、誰がこの料理を作ったのですか？',
      targetGap: 'subject',
      answerSense: null,
      thread: '糸2',
      en: 'Who cooked this dish yesterday?',
      nuance: '主語を問うwhは糸1なし。時制は裸動詞の活用 cooked に乗る（×did cook）。',
      parts: [
        { role: 'X', text: 'Who', note: '主語を問うwh' },
        { role: 'V', text: 'cooked', note: '過去・裸動詞' },
        { role: 'X', text: 'this dish', note: '目的語' },
        { role: 'Z', text: 'yesterday', note: '時の副詞' },
      ],
      distractors: [
        {
          label: '主語whへの助動詞前置',
          words: ['Did', 'cook'],
          reason: '主語をたずねる疑問文では助動詞を前に出さず、Who の直後に本動詞が続きます（×Did who cook…）。',
        },
        {
          label: '主語whへのdo挿入',
          words: ['Do', 'does'],
          reason: '主語を問う wh では do/does/did を挿入しません。時制は cooked のように本動詞の活用で表します。',
        },
      ],
    },
    {
      jp: '何がそんなに面白いのですか？',
      targetGap: 'subject',
      answerSense: null,
      thread: '糸2',
      en: 'What is so funny?',
      nuance: '主語Whatに be が続く。be は本動詞なので語順そのまま、糸1の助動詞挿入なし。',
      parts: [
        { role: 'X', text: 'What', note: '主語を問うwh' },
        { role: 'V', text: 'is', note: 'be・現在' },
        { role: 'Z', text: 'so funny', note: '補語的な様態' },
      ],
      distractors: [
        {
          label: '主語whにbeを前に出す',
          words: ['Is', 'What'],
          reason: 'What が主語の位置にあり、その直後に be が続く語順です。be を文頭に出すのは主語を問う形ではありません。',
        },
        {
          label: '主語whへのdo挿入',
          words: ['Does', 'be'],
          reason: '主語を問う疑問文では do を挿入しません。be 動詞もそのまま What is… の順です。',
        },
      ],
    },
  ],
  3: [
    {
      jp: 'あなたは昨日どこでそのカバンを買いましたか？',
      targetGap: 'where',
      answerSense: 'point',
      thread: '糸1+糸2',
      en: 'Where did you buy the bag yesterday?',
      nuance: '糸2で Where を前出し、糸1の do挿入(did)。挿入後の本動詞は原形 buy。',
      parts: [
        { role: 'Z', text: 'Where', note: '場所を問うwh' },
        { role: 'V', text: 'did buy', note: 'do挿入・原形' },
        { role: 'X', text: 'you', note: '主語' },
        { role: 'X', text: 'the bag', note: '目的語' },
        { role: 'Z', text: 'yesterday', note: '時の副詞' },
      ],
      distractors: [
        {
          label: '疑問詞を文末に置く',
          words: ['you', 'where'],
          reason: '場所を問う wh は文頭に出します（Where did you…）。where を文末に置くのは間接疑問や平叙文の語順です。',
        },
        {
          label: 'do挿入なしの過去形',
          words: ['bought', 'Where'],
          reason: '一般動詞の過去疑問では did を前に出し、本動詞は原形 buy にします。bought だけでは疑問文になりません。',
        },
      ],
    },
    {
      jp: '次のバスはいつ出発しますか？',
      targetGap: 'when',
      answerSense: 'point',
      thread: '糸1+糸2',
      en: 'When does the next bus leave?',
      nuance: 'When を前出し、三単現の does を挿入。leave は原形。',
      parts: [
        { role: 'Z', text: 'When', note: '時を問うwh' },
        { role: 'V', text: 'does leave', note: 'do挿入・三単現' },
        { role: 'X', text: 'the next bus', note: '主語' },
      ],
      distractors: [
        {
          label: '三単現でdoと活用形を併用',
          words: ['Do', 'leaves'],
          reason: '三人称単数では does を前に出し、本動詞 leave は原形のままです。Do と leaves の併用は誤りです。',
        },
        {
          label: '主語whの語順にする',
          words: ['Did', 'When'],
          reason: 'When は副詞的な疑問詞なので文頭に出し、助動詞を主語の前に置きます。主語を問う語順とは異なります。',
        },
      ],
    },
  ],
  4: [
    {
      jp: 'なぜ（何のために）あなたは海外で働くことを選んだのですか？',
      targetGap: 'why',
      answerSense: 'purpose',
      thread: '糸1+糸2',
      en: 'Why did you choose to work abroad?',
      nuance: 'why は目的(purpose)を狙う出題。答えは to不定詞で意図を述べる。',
      answerSentence: 'To find what I really want to do.',
      parts: [
        { role: 'Z', text: 'Why', note: '理由/目的を問うwh' },
        { role: 'V', text: 'did choose', note: 'do挿入・原形' },
        { role: 'X', text: 'you', note: '主語' },
        { role: 'X', text: 'to work abroad', note: '目的語(to不定詞)' },
      ],
      distractors: [
        {
          label: '原因と目的の取り違え',
          words: ['Because'],
          reason: 'Why で目的を問う疑問文の答えは to不定詞などで。Because は原因を述べる語で、疑問文の文頭には来ません。',
        },
        {
          label: 'do挿入なしの過去形',
          words: ['chose', 'Why'],
          reason: '一般動詞の過去疑問では did を前に出し、choose は原形にします。chose だけでは疑問文の組み立てになりません。',
        },
      ],
    },
    {
      jp: '駅まではどうやって行けばいいですか？',
      targetGap: 'how',
      answerSense: 'means',
      thread: '糸1+糸2',
      en: 'How do I get to the station?',
      nuance: 'how は手段(means)。道案内の答えは命令文になりやすい。',
      answerSentence: 'Go straight and turn left at the corner.',
      parts: [
        { role: 'Z', text: 'How', note: '手段を問うwh' },
        { role: 'V', text: 'do get', note: 'do挿入・原形' },
        { role: 'X', text: 'I', note: '主語' },
        { role: 'Z', text: 'to the station', note: '到達点' },
      ],
      distractors: [
        {
          label: '手段と状態の取り違え',
          words: ['What', 'like'],
          reason: '「どうやって行くか」は手段を問う How。「どんな状態か」を問う What … like とは意図が異なります。',
        },
        {
          label: 'be動詞を前に出す',
          words: ['Are', 'getting'],
          reason: 'get は一般動詞なので do を前に出します。be+ing は進行形の別の組み立てです。',
        },
      ],
    },
  ],
  5: [
    {
      jp: 'あなたはどの本を先に読みましたか？',
      targetGap: 'which+名詞',
      answerSense: null,
      thread: '糸1+糸2',
      en: 'Which book did you read first?',
      nuance: '限定詞型。Which が名詞 book を引き連れ、2語で前出。',
      parts: [
        { role: 'X', text: 'Which book', note: '限定詞型wh(2語)' },
        { role: 'V', text: 'did read', note: 'do挿入・原形' },
        { role: 'X', text: 'you', note: '主語' },
        { role: 'Z', text: 'first', note: '順序の副詞' },
      ],
      distractors: [
        {
          label: 'which↔what の取り違え',
          words: ['What'],
          reason: '日本語「どの本」は特定の中から選ぶ Which。What は不特定・種類を問う場合が多く、出題の意図とずれます。',
        },
        {
          label: '疑問詞だけ前に出す',
          words: ['Which', 'the'],
          reason: '限定詞型では Which と名詞 book をセットで文頭に出します。Which のあとに the book を後置する語順は誤りです。',
        },
      ],
    },
    {
      jp: 'あなたは誰と一緒に行ったのですか？',
      targetGap: '前置詞残留',
      answerSense: null,
      thread: '糸1+糸2',
      en: 'Who did you go with?',
      nuance: '口語は前置詞残留。with を元位置に残す（フォーマルは With whom）。',
      parts: [
        { role: 'X', text: 'Who', note: '目的語を問うwh' },
        { role: 'V', text: 'did go', note: 'do挿入・原形' },
        { role: 'X', text: 'you', note: '主語' },
        { role: 'Z', text: 'with', note: '残留した前置詞' },
      ],
      distractors: [
        {
          label: '前置詞の引き連れ（フォーマル）',
          words: ['With', 'whom'],
          reason: '口語では前置詞 with を文末に残します。With whom はフォーマルな引き連れで、この訓練の模範とは異なります。',
        },
        {
          label: '前置詞を疑問詞の前に出す',
          words: ['with', 'Who'],
          reason: '前置詞残留では Who が文頭、with は文末です。前置詞を文頭に出すのは別の構文です。',
        },
      ],
    },
  ],
  6: [
    {
      jp: '駅がどこにあるか教えてもらえますか？',
      targetGap: '従属節gap',
      answerSense: null,
      thread: '糸1解除',
      en: 'Could you tell me where the station is?',
      nuance: '二重疑問構造。主節 Could you に糸1、従属節は糸1解除で平叙語順 where the station is。',
      parts: [
        { role: 'V', text: 'Could tell', note: '主節・糸1' },
        { role: 'X', text: 'you / me', note: '主語・間接目的語' },
        { role: 'Y', text: 'where the station is', note: '従属節(平叙語順)' },
      ],
      distractors: [
        {
          label: '従属節内の助動詞前置',
          words: ['is', 'where'],
          reason: '従属節は where the station is の平叙語順です。is を主語の前に出す直接疑問の形は使いません。',
        },
        {
          label: '従属節にdo挿入',
          words: ['did', 'Where'],
          reason: '間接疑問の従属節では did を挿入しません。where the station is のように平叙文と同じ語順です。',
        },
      ],
    },
    {
      jp: 'どうやってそこへ行けばいいか分かりますか？',
      targetGap: '疑問詞+to不定詞',
      answerSense: null,
      thread: '糸1解除',
      en: 'Do you know how to get there?',
      nuance: '間接疑問の縮約形。how to get で「行き方」を表し、従属節に糸1なし。',
      parts: [
        { role: 'V', text: 'Do know', note: '主節・do挿入' },
        { role: 'X', text: 'you', note: '主語' },
        { role: 'X', text: 'how to get there', note: '疑問詞+to不定詞' },
      ],
      distractors: [
        {
          label: '従属節を直接疑問の語順に',
          words: ['how', 'do', 'get'],
          reason: 'how to get there は疑問詞+to不定詞の縮約形です。how do you get… の直接疑問の語順は従属節では使いません。',
        },
        {
          label: '従属節にdo挿入',
          words: ['did', 'How'],
          reason: '埋め込まれた節では助動詞を前に出さず、how to get の形で平叙的に続けます。',
        },
      ],
    },
  ],
  7: [
    {
      jp: 'コーヒーと紅茶、どちらになさいますか？',
      targetGap: 'alternative',
      answerSense: null,
      thread: '糸1',
      en: 'Would you like coffee or tea?',
      nuance: '選択疑問。Yes/Noの土台に or で選択肢を足す。',
      parts: [
        { role: 'V', text: 'Would like', note: '丁寧な申し出' },
        { role: 'X', text: 'you', note: '主語' },
        { role: 'X', text: 'coffee or tea', note: '選択肢' },
      ],
      distractors: [
        {
          label: '選択肢なしのYes/No疑問',
          words: ['Do', 'want'],
          reason: '「A か B か」を問う選択疑問では or で選択肢を示します。単純な Do you want… では選択の意図が伝わりません。',
        },
        {
          label: 'and で並列する',
          words: ['and'],
          reason: '選択疑問では or で二者択一を示します。and は「両方」になり、選択の意図とずれます。',
        },
      ],
    },
    {
      jp: 'あなたは夕食を食べないのですか？',
      targetGap: 'negative',
      answerSense: null,
      thread: '糸1',
      en: "Don't you eat dinner?",
      nuance: '否定疑問。do挿入 + not を前出。',
      parts: [
        { role: 'V', text: "Don't eat", note: '否定疑問・do挿入' },
        { role: 'X', text: 'you', note: '主語' },
        { role: 'X', text: 'dinner', note: '目的語' },
      ],
      distractors: [
        {
          label: '平叙の否定をそのまま疑問に',
          words: ['you', "don't"],
          reason: '否定疑問では Don\'t you…? のように not を助動詞と一体で前に出します。平叙の否定語順では疑問文になりません。',
        },
        {
          label: 'Do と not を別々に並べる',
          words: ['Do', 'not'],
          reason: '否定疑問は Don\'t のように短縮形で前に出すのが自然です。Do you not… は別の強調的な形です。',
        },
      ],
    },
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
      ...assembleWordPoolData(pick.en, pick.distractors, {
        step,
        targetGap: pick.targetGap,
      }),
    });
  }

  return items;
}
