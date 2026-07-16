---
id: pj-2026-06-28-36ea
aliases:
- pj-2026-06-28-36ea
title: 疑問文トレーナー — 構造マップ & スコープ確定
created: '2026-06-28'
---
# 疑問文トレーナー — 構造マップ & スコープ確定

> **この文書の位置づけ**
> English-Question-Trainer（仮称）の **設計の土台（single source of truth）**。
> Cursor 向け work-request に展開する前段として、「疑問文・間接疑問文・答え文に、どんな分岐が存在するか」を MECE に把握し、各分岐に **第1層 / 第2層 / 除外** のスコープタグを振ることを目的とする。
> **注意：これは"設計者が分岐を把握するための地図"であり、アプリに全分岐を MECE 実装する仕様ではない。** 初版は第1層のみを実装し、第2層は後追いする。

---

## 0. 設計の背骨（エッセンス）

疑問文は、平叙文に対する **2つの操作** に還元される。これ以上でも以下でもない。

- **糸1 = 助動詞を主語の前に出す**（Yes/No 疑問文の核）
- **糸2 = 空所を作り、疑問詞を文頭に移動する**（wh 疑問文の核）

3つの型は MECE に分かれる。

| 疑問文の型 | 使う操作 |
|---|---|
| Yes/No | 糸1 のみ |
| wh（主語以外を聞く） | 糸1 + 糸2 |
| wh（主語を聞く） | 糸2 のみ（糸1 なし） |

**時制は独立軸ではなく、糸1のパラメータに畳み込まれる。** 時制が顔を出す場所は MECE に2つだけ。

| 時制が現れる場所 | どこに出るか | 例 |
|---|---|---|
| 糸1がある文 | 前に出す助動詞の選択 | do/does/**did**/is/was/have/**had**/will/can… |
| 糸1がない文（主語wh） | 裸の動詞の活用 | Who **broke** it?（過去）/ Who **breaks** it?（現在） |

→ 訓練すべきは「24形すべて」ではなく、**①時制→助動詞の対応表**と**②主語疑問のときの動詞活用**の2点。

---

## 1. 直接疑問文 — 7軸の構造マップ

### 軸の直交性（MECE宣言）

- **軸1（答えの種類）・軸5（糸1の機構）・軸7（時制）は相互に直交**（自由に組合せ可）
- **軸2 → 軸3 → 軸4 は従属チェーン**（聞く対象が疑問詞の形と「前に出る単位」を縛る）
- **軸6（主語か否か）は軸5を起動/解除するゲート**

---

### 軸1【答えの種類】（MECE）

| 種類 | 答え | 操作 | 例 | 層 |
|---|---|---|---|---|
| 真偽 (polar) | Yes/No | 糸1のみ | Did you buy it? | 第1層 |
| 情報 (content) | 具体情報 | 糸1±糸2 | What did you buy? | 第1層 |
| 選択 (alternative) | 選択肢 | Yes/No + "or B" | Tea or coffee? | 第1層 |

---

### 軸2【聞くスロット】（MECE＝文の5要素 S/V/O/C/M に対応・wh のみ）

| スロット | 疑問詞 | 層 |
|---|---|---|
| S・O・C（名詞役X） | who / whom / what / which / whose | 第1層 |
| M（修飾＝副詞役Z） | when / where / why / how | 第1層 |
| V（動詞そのもの） | 専用語なし → do の目的語として what で代用：What do you **do**? | 認識のみ |

> **気づき①：動詞を問う専用の疑問詞が英語に無い。** 「何をする？」は `do + what` の借用。出題設計の前提として把握する。

---

### 軸3【疑問詞の形態】（MECE）

| 型 | 中身 | 例 | 層 |
|---|---|---|---|
| 代名詞型（単独で名詞スロット） | who, whom, what, which | What broke? | 第1層 |
| 限定詞型（名詞を引き連れる） | which/what/whose + 名詞 | **Which book** / **What time** / **Whose bag** | 第1層 |
| 副詞型（単独でMスロット） | when, where, why, how | Where…? | 第1層 |
| 程度・数量型（how + α） | how old/many/much/often/long/far | **How many** books…? | 第2層 |

> **気づき②：how は原子ではない。** how+形容詞/副詞/数量詞で「句」を作り、一体で前に出る。
> **気づき③：限定詞型（which/what/whose + 名詞）は前に出る単位が2語以上**になる。

---

### 軸4【糸2で前に出る単位の大きさ】（MECE）

| 大きさ | 例 | 層 |
|---|---|---|
| 単語 | **What** did you buy? | 第1層 |
| 疑問詞+名詞（限定詞型） | **Which book** did you read? | 第1層 |
| 疑問詞+形容詞/副詞（程度型） | **How old** are you? | 第2層 |
| 前置詞残留 (stranding) | Who did you go **with**? | 第1層 |
| 前置詞+疑問詞（引き連れ／pied-piping） | **With whom** did you go? | 第2層 |

> **気づき④：前置詞の引き連れ vs 残留。** 口語は残留が普通。フォーマルは引き連れ。

---

### 軸5【糸1の機構】（MECE・3分岐 ＝ 実装で最重要）

| 機構 | 起動条件 | 例 | 層 |
|---|---|---|---|
| be動詞 | 本動詞が be | **Is** she happy? / **Was** he there? | 第1層 |
| 既存の助動詞 | have/will/can/be+ing 等がある | **Have** you eaten? / **Can** you swim? | 第1層 |
| do挿入 (do-support) | 一般動詞で助動詞が無いときだけ | **Do/Does/Did** you run? | 第1層 |

> **気づき⑤：do挿入は「助動詞が無いとき限定で起動する隠れ機構」。** be や既存助動詞があるときは do を使わない（×Do you can swim?）。
> 学習者の最頻出エラー源。生成時にこの3分岐を取り違えると壊れる。**糸1を1機構として扱わず、必ず3機構に割って生成する。**

---

### 軸6【主語位置か否か】（糸1の有無を決定・MECE）

| | 糸1 | サブケース | 層 |
|---|---|---|---|
| 主語以外を聞く | 起動 | — | 第1層 |
| 主語を聞く | 不起動（語順そのまま） | 代名詞型：Who broke it? ／ 限定詞型：**Which student** broke it? | 第1層（代名詞型）/ 第2層（限定詞型） |

> **気づき⑥：主語wh でも determiner型（Which X）があり、名詞ごと主語位置に残ったまま糸1なし。**

---

### 軸7【時制・態 ＝ 糸1のパラメータ】

第1層の核時制：現在 (do/does)・過去 (did)・be (is/are/was/were)・未来 (will)・現在完了 (have/has)。
拡張（第2層）：過去完了 (had)・完了進行・受動疑問（be+pp：**Was** it made by him?）。
主語wh のときだけ、時制は前に出る助動詞ではなく**裸動詞の活用**に乗る（Who **made** it? / Who **makes** it?）。

---

## 2. 間接疑問文レイヤー（主節＋従属節）

直接疑問より **レイヤーが1段上がる**。感覚的に頻出するため初版に含める（複雑な関係詞修飾は別物として排除）。

| 軸 | 内容 | 層 |
|---|---|---|
| I 埋め込み元の型 | Yes/No→whether/if節 ／ wh→wh節 ／ 選択→whether A or B | 第1層 |
| II 従属節内の操作 | 糸2は**保持**（疑問詞は節頭）／ 糸1は**解除**（平叙語順 S-V、do挿入も消える） | 第1層 |
| III 主節トリガー | 平叙：I know / I wonder / Tell me ／ 疑問：Do you know …? | 第1層 |
| IV 疑問詞+to不定詞（縮約形） | what to do / where to go / how to get to… | 第1層 |
| V whether vs if | if＝口語・目的語位置／whether＝フォーマル・or not・to不定詞前・主語/補語 | 第2層 |
| VI 時制の一致 (backshift) | 主節が過去→従属節も過去へずれる（I asked what he **wanted**） | 第2層 |

> **気づき⑦：二重疑問構造。** 主節に糸1、従属節に糸1なし（Do you know **where the station is**?）。道聞きの主力。間接疑問を入れる以上、第1層級。
> **気づき⑧：backshift は話法と接続。** 瞬発の主目的と別軸のため第2層。
> **気づき⑨：疑問詞+to不定詞は間接疑問の縮約。** how to get to… は旅行最頻出・低コスト。間接の入口として第1層。

**核心の罠（実装で必ず守る）**：従属節では糸1を**解除**する。
`What did he buy?` → `…what he **bought**`（did を消し、語順を平叙に戻す）。

---

## 3. 答え文機能 — 構造マップ

### エッセンス：答え文を用意する価値があるのは「副詞役(Z)を聞く疑問詞」

| 種別 | 疑問詞 | 答えの中身 | 答えの作り方 |
|---|---|---|---|
| 名詞役(X)を聞く | who / what / which / whose | 名詞1個 | スロットを埋めるだけ（産出スキル不要） |
| 副詞役(Z)を聞く | when / where / **why** / **how** | 副詞的要素 | 句・節を**構築する**（疑問文産出と同じスキル） |

→ 答え文機能は本質的に **Zを聞く疑問詞ファミリー（when/where/why/how）** に向く。初版は why/how に限定。

---

### 3-1. WHY の答え文

**軸1【意味＝因果軸の向き】（whyのエッセンス・MECE）**

| 向き | 何を聞くか | 時間の向き | 典型の答え形 |
|---|---|---|---|
| 原因・理由 | なぜ起きたか | 後ろ向き（過去因） | Because S V / Because of N |
| 目的 | 何のためか | 前向き（未来の意図） | To do / In order to / So that S V / For N |

**軸2【答えの文法形式】（MECE・サイズ別）**

| 形式 | 例 | 向き |
|---|---|---|
| 接続詞+節 | Because I was tired. / Since it's late. | 原因 |
| 前置詞+句 | Because of the rain. / Due to traffic. | 原因 |
| to不定詞 | To catch the train. | 目的 |
| so that 節 | So that I could pass the exam. | 目的 |
| for+名詞 | For my health. | 目的 |
| 副詞句単独 | Out of curiosity. | 原因（動機） |

**Q↔A 対応**

```
Why did you buy it?
  ├─[原因] Because it was on sale.        ← because節（過去）
  └─[目的] To give it to my friend.       ← to不定詞（意図）
```

**周辺の気づき**
- **How come** は why と同義だが、唯一**糸1を起動しない**（平叙語順）：How come you're late?（×How come are you…）
- **What … for?** も「目的のwhy」：What did you buy it **for**?（前置詞残留）
- **Why not?** は省略疑問。提案応答に頻出。

---

### 3-2. HOW の答え文（最も多義・要注意）

**核心：how は1つの疑問詞ではなく、複数の別物が同じ綴りを共有するファミリー。** 意味軸は概ねMECEだが、bare how（手段／様態）は境界が滲む（→ 一意性問題に直結）。

**軸1【意味の種別】**

| 種別 | 例 | 答えの形 | how+語か | 層 |
|---|---|---|---|---|
| 手段・方法 (means) | How did you get here? | By bus. / By taking the train. | how単独 | 第1層 |
| 様態・やり方 (manner) | How did she sing? | Beautifully. / With great care. | how単独 | 第1層 |
| 状態・調子 (state) | How are you? | I'm fine. / Tired. | how単独 | 第1層 |
| 程度 (degree) | How old/tall/far? | 24. / 180 cm. | how+形/副 | 第2層 |
| 数量 (quantity) | How many/much? | Three. / A lot. | how+量詞 | 第2層 |
| 頻度・期間 | How often/long? | Twice a week. / For two hours. | how+副 | 第2層 |
| 感想・評価 | How was the trip? | It was great. | how単独 | 第1層 |

**軸2【答えの文法形式】（MECE）**

| 形式 | 例 | 主な対応意味 |
|---|---|---|
| by + 名詞/動名詞 | By bus. / By studying daily. | 手段 |
| with + 名詞 | With a knife. | 道具・手段 |
| 様態副詞 | Carefully. / Quickly. | 様態 |
| 形容詞 | Fine. / Exhausted. | 状態 |
| 測定値・数量 | 180 cm. / Three times. | 程度・数量 |
| 命令文（手順・道案内） | Go straight and turn left. | how-to / 道聞き |

**周辺の気づき**
- **how-question は命令文で答えることが多い**（How do I get to the station? → Go straight…）。道聞きの主力。who/what では起きない非対称。
- **How to do X** は間接疑問の縮約（気づき⑨）。"Could you tell me how to get there?"
- **How about / What about** は提案。形式が違う（how + 名詞/動名詞）。

---

### 3-3. how/why 以外に答え文を設ける価値があるもの

| 疑問詞 | 答え文の価値 | 理由 | 推奨 |
|---|---|---|---|
| why / how | 高 | 答えが必ず句・節の構築 | 第1層（初版） |
| when | 中 | 答えが時の副詞節になりうる（After I eat. / When I get home.） | 第2層 |
| where | 中 | 答えが場所の句/関係副詞節（At the corner. / Where the road ends.） | 第2層 |
| what（慣用） | 中〜高 | 下記の定型は答えが構造を持つ | 第2層（特例） |
| who / which / whose | 低 | 答えは名詞スロット埋めのみ | 設けない |

**what の慣用パターン（答えが構造を持つ特例・第2層）**

| 疑問 | 答えの構造 | 場面 |
|---|---|---|
| What do you **do**? | I'm a / I work as… | 自己紹介 |
| What is it **like**? | It's + 形容詞/描写 | 描写 |
| What is it **made of**? | (It's made) of wood. | 物の説明 |
| What … **for**? | To do …（＝目的why） | 目的 |

→ when/where を入れると、Zを聞く疑問詞4つ（when/where/why/how）が答え文ファミリーとして MECE に揃う。設計上はこの4つを「答え文あり」、who/what/which/whose を「答え文なし（名詞スロット）」と二分するのが最もきれい。

---

## 4. 一意性担保メタデータ仕様

出題日本語が複数の妥当な英文を許すと、模範解答が割れて採点が破綻する。これを防ぐため各問にメタデータを固定する。

| フィールド | 役割 | 値の例 | 適用 |
|---|---|---|---|
| `targetGap` | 聞くスロットを固定 | subject / object / complement / when / where / why / how / yesno | 全疑問文 |
| `answerSense` | why/how の答えセンスを固定 | cause / purpose（why）／ means / manner / state / degree（how） | **why・how の答え文のみ** |

> **本命の気づき：why/how の疑問文は単体では答えの形を一意に決めない。**
> ```
> Why did you go to the store?
>   → Because I was hungry.（原因）   ← 両方とも正解
>   → To buy some milk.（目的）        ← どちらも文法的に妥当
> ```
> 答え文を用意するなら、ペア作成時に `answerSense` を必ず固定する。これが今回最大の考慮漏れ防止ポイント。

---

## 5. スコープ確定表（総覧）

### 第1層（初版で実装）

- **疑問文の型**：Yes/No・wh(非主語)・wh(主語) ／ 選択疑問・否定疑問
- **糸1の3機構**：be / 既存助動詞 / do挿入（必ず3分岐で生成）
- **疑問詞**：who/whom/what/which/whose/when/where/why/how（単独）＋ 限定詞型（which/what/whose+名詞）
- **前置詞**：残留 (stranding)
- **時制**：現在・過去・be・未来・現在完了
- **間接疑問**：埋め込み3型／従属節の糸1解除／二重疑問構造／疑問詞+to不定詞
- **答え文**：why（原因/目的）・how（手段/様態/状態/感想）
- **メタデータ**：`targetGap` ＋ `answerSense`

### 第2層（後追い）

- how+α（程度/数量/頻度）／ pied-piping（前置詞引き連れ）／ 受動疑問
- 過去完了・完了進行
- 主語wh の限定詞型
- 間接疑問：whether/if の使い分け・backshift（時制の一致）
- 答え文：when・where／ what 慣用（do/like/made of/for）

### 除外

- 付加疑問文（…, isn't it?）— 産出ロジックが別物（平叙文＋確認タグ）
- 修辞疑問文
- 間接疑問が主節の主語/補語（What he wants is…）— 関係詞的複雑度・目的外

---

## 6. 産出の意思決定ツリー（取りこぼし防止）

生成ロジックを実装するときの分岐順。各ノードで上のスコープタグを参照する。

```
平叙文の意味を確定
│
├─【答えの種類は？】（軸1）
│   ├─ 真偽   → Yes/No（糸1のみ）→ 軸5へ
│   ├─ 選択   → Yes/No + "or B" → 軸5へ
│   └─ 情報   → wh（軸2へ）
│
├─【何を聞く？】（軸2：S/V/O/C/M）
│   ├─ 名詞役(X: S/O/C) → who/what/which/whose
│   └─ 副詞役(Z: M)      → when/where/why/how
│        └─ 動詞(V)を聞く → do+what で借用（気づき①）
│
├─【主語を聞く？】（軸6＝糸1ゲート）
│   ├─ YES → 糸2のみ・糸1なし・語順そのまま（時制は裸動詞に乗る）
│   └─ NO  → 糸1 + 糸2
│
├─【糸1の機構は？】（軸5・必ず3分岐）
│   ├─ 本動詞が be        → be を前出
│   ├─ 既存助動詞あり      → それを前出（×do）
│   └─ 一般動詞・助動詞なし → do/does/did を挿入
│
├─【前出する単位は？】（軸3→4）
│   ├─ 単語 / 限定詞型(+名詞) / 程度型(how+α)
│   └─ 前置詞：残留 or 引き連れ
│
└─【間接疑問にする？】
    ├─ NO → 直接疑問で確定
    └─ YES→ 主節トリガー付与 ＋ 従属節の糸1を解除（do消す・平叙語順）
              └─ 縮約するなら 疑問詞+to不定詞
```

---

## 7. 既知の生成制約（不変条件）

- **1文1疑問詞**：2つ同時に聞けない（×What who did he give?）。生成時に強制。
- **do挿入の排他性**：be・既存助動詞があるとき do を使わない。
- **主語wh の糸1禁止**：Who/Which X が主語のとき助動詞前置をしない。
- **間接疑問の糸1解除**：従属節は平叙語順。do を残さない。
- **ハードな不変条件はコードで強制**（確率的プロンプト依存にしない）：1文1疑問詞・糸1の3分岐・主語wh の糸1禁止・従属節の糸1解除。

---

## 8. 用語集

| 用語 | 定義 |
|---|---|
| 糸1 | 助動詞を主語の前に出す操作（Yes/No 疑問文の核） |
| 糸2 | 空所を作り疑問詞を文頭に移動する操作（wh 疑問文の核） |
| do挿入 (do-support) | 一般動詞で助動詞が無いとき do/does/did を補う機構 |
| 限定詞型wh | which/what/whose + 名詞（前出単位が2語以上） |
| pied-piping | 前置詞を疑問詞と一緒に前出（With whom…） |
| stranding | 前置詞を元位置に残す（…with?） |
| 二重疑問構造 | 主節に糸1・従属節に糸1なしの間接疑問（Do you know where it is?） |
| backshift | 主節過去に合わせ従属節も過去へずれる時制の一致 |
| `targetGap` | 聞くスロットを固定する出題メタデータ |
| `answerSense` | why/how の答えセンス（原因/目的・手段/様態…）を固定するメタデータ |
