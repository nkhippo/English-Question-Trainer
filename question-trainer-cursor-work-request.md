# Cursor Work-Request — English-Question-Trainer 新規構築

> **リポジトリ**: https://github.com/nkhippo/English-Question-Trainer
> **方針**: 既存の `english-structure-trainer` の規約・アーキテクチャを踏襲した**新規リポジトリ**を構築する。下の「§4 既存トレーナーから意図的に変える点」だけは明示的に異なるので厳守すること。

---

## 0. 正本（source of truth）とドリフト防止

実装の判断は、以下4つの正本ドキュメントに従う。**これらと矛盾するコードを書かないこと。**

| 正本 | 役割 |
|---|---|
| `question-trainer-requirements-design.md` | 要件・設計（最上位。迷ったらこれ） |
| `question-trainer-structure-map.md` | 文法スコープ・STEP定義・シーンプール・メタデータ |
| `question-trainer-decision-tree.svg` | 生成ロジックの分岐（不変条件の根拠） |
| `question-trainer-prototype.html` | **UIの視覚的正本**。画面構成・配色・コンポーネント分割はこれを再現する |

**ドリフト防止（必須）**:
- 本書に書かれた関数名・定数・スキーマを**勝手に改名しない**。変更が必要なら理由をコメントで残す。
- プロンプト本文・JSONスキーマ・バリデーション条件は**正本どおり**に実装し、要約・省略しない。
- 既存トレーナーのファイルを参照するときは、**実コードを開いて確認**してから真似る（ドキュメント先行で書かない）。

---

## 1. リポジトリ前提

- スタック: **React + Vite**、GitHub Pages デプロイ、**Google Apps Script (GAS) プロキシ**経由で Claude API を呼ぶ。
- 既存トレーナー（`english-structure-trainer`）の以下の規約を踏襲する:
  - `src/api/claude.js` の呼び出しパターン
  - `src/prompts/` にプロンプト構築関数を集約
  - `src/constants/` に steps / roles などの定数
  - `src/components/` に画面部品（`QuestionCard.jsx`, `PartBreakdown.jsx` 等の命名感）
  - `prompt-dumps/` + `scripts/dump-prompts.mjs` でプロンプトをMDダンプ
  - ルート直下に設計ドキュメント `*.md` を置く運用
  - `.github/workflows/deploy.yml` で Pages デプロイ

---

## 2. ターゲットファイルツリー

`[新規]`=新しく書く / `[流用]`=構造トレーナーから移植・パターン踏襲 / `[正本]`=既存ドキュメントをコピー配置

```
English-Question-Trainer/
├── .github/workflows/deploy.yml          [流用] Pages デプロイ（base path だけ変更）
├── prompt-dumps/
│   ├── generate/
│   │   ├── step1.md … step7.md           [新規] 各STEPの生成プロンプトのダンプ
│   │   └── combined.md                    [新規] 総合モードのダンプ例
│   └── README.md                          [流用]
├── scripts/
│   └── dump-prompts.mjs                   [流用] 生成プロンプトを prompt-dumps/ に出力
├── gas/
│   └── proxy.gs                           [新規] GASプロキシ（APIキー秘匿）
├── src/
│   ├── api/
│   │   └── claude.js                      [新規] generateBatch() 1コール（§5）
│   ├── assets/
│   │   ├── structure-map.md               [正本] question-trainer-structure-map.md を配置
│   │   └── textbook.md                    [流用] X/Y/Z/V 参照（任意）
│   ├── components/
│   │   ├── Header.jsx                     [新規] 織機モチーフ＋ワードマーク
│   │   ├── ProgressRail.jsx               [新規] 4フェーズ進捗バー
│   │   ├── ModeToggle.jsx                 [新規] STEP個別／総合
│   │   ├── StepSelect.jsx                 [新規] 7 STEPカード（選択）
│   │   ├── ThreadTag.jsx                  [新規] 糸1/糸2/糸1+糸2/糸1解除 タグ
│   │   ├── QuestionCard.jsx               [流用] 出題：jp + textarea
│   │   ├── ReviewCard.jsx                 [新規] 模範解答＋ポイント＋メタ＋構造分解
│   │   ├── PartBreakdown.jsx              [流用] X/Y/Z/V チップ（構造トレーナーから移植）
│   │   └── ExportPanel.jsx                [新規] MDプレビュー＋DL/コピー
│   ├── constants/
│   │   ├── steps.js                       [新規] 7 STEP定義（§6）
│   │   ├── scenePool.js                   [新規] シーン/機能プール（structure-map §9）
│   │   ├── roles.js                       [流用] X/Y/Z/V 役割メタ
│   │   └── coreTenses.js                  [新規] 核5時制
│   ├── prompts/
│   │   ├── generate.js                    [新規] buildGeneratePrompt()
│   │   └── shared.js                      [新規] system文・JSON規約・不変条件文言
│   ├── utils/
│   │   ├── validateItems.js               [新規] 不変条件のコード強制（§7）
│   │   ├── formatExportMarkdown.js        [流用] MD整形（formatResultsMarkdown を下敷き）
│   │   └── parts.js                       [流用] 構造分解整形
│   ├── App.jsx                            [新規] フェーズ状態機械（§8）
│   └── main.jsx                           [流用]
├── index.html                             [流用]
├── package.json                           [流用] 依存を踏襲
├── vite.config.js                         [流用] base を変更
├── README.md                              [新規]
├── question-trainer-requirements-design.md [正本] ルート配置
├── question-trainer-structure-map.md       [正本] ルート配置
├── question-trainer-decision-tree.svg      [正本] ルート配置
└── .gitignore                              [流用]
```

---

## 3. 既存トレーナーから流用するパターン（mirror）

- **`PartBreakdown.jsx`**: X/Y/Z/V を色付きチップで表示する既存コンポーネントをほぼそのまま移植。役割色はプロトタイプの `--rX/--rV/--rY/--rZ` に合わせる。
- **`utils/parts.js`**: `parts[]` をネスト整形するロジック（grading-prompt.md の `formatPartsForCheck` 相当）。MDエクスポートと画面表示の両方で使う。
- **`utils/formatExportMarkdown.js`**: 構造トレーナーの `formatResultsMarkdown.js` を下敷きに、§10のテンプレへ差し替え。
- **`api/claude.js`**: fetch の組み立て・エラーハンドリング・`[` prefill の付け方を踏襲。ただし**呼び出しは1回のみ**（§4）。
- **`scripts/dump-prompts.mjs`**: `prompts/generate.js` を各STEPで評価し `prompt-dumps/generate/*.md` に書き出す。
- **`vite.config.js` / `deploy.yml`**: Pages 用 `base` をリポジトリ名に変更（§11）。

---

## 4. 既存トレーナーから意図的に変える点（DIVERGENCE・厳守）

ここが構造トレーナーと**違う**。混同しないこと。

| # | 構造トレーナー | 本アプリ（Question Trainer） |
|---|---|---|
| D-1 | 生成と採点で**2種類のプロンプト・複数コール** | **生成1種類・1コールのみ**。問題＋模範解答＋根拠を**セット生成**。採点コールは持たない |
| D-2 | Claude が答え合わせ（採点）する | **v1はAI採点なし**。模範解答を表示し、MD出力 → デスクトップClaude Projectsで添削する運用 |
| D-3 | APIキーをクライアントで入力（`ApiKeyInput.jsx`） | **APIキーはGASで管理**。`ApiKeyInput.jsx` は作らない。`claude.js` は GAS プロキシURLを叩く |
| D-4 | 1セッション 7問・2問ずつ採点 | 1セッション **5問**・**完全ランダム**（総合モードは選択STEP集合から） |
| D-5 | declarative/interrogative トグル | なし。出題は常に疑問文。STEP軸で操作を切り替える |
| D-6 | Step 3〜7 | **STEP 1〜7**（疑問文専用の操作ベース。§6） |

> **D-1/D-2 が最重要**。「生成は1回・セット」を崩さないこと。模範解答を別コールにしない。

---

## 5. 生成API（1コール）

### 5-1. `gas/proxy.gs`（APIキー秘匿）

Script Properties に `CLAUDE_API_KEY` を保存し、フロントからのPOSTをClaude APIへ中継する。

```javascript
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY'),
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
  return ContentService.createTextOutput(res.getContentText())
    .setMimeType(ContentService.MimeType.JSON);
}
```

- デプロイ: ウェブアプリ / 実行ユーザー=自分 / アクセス=全員（個人運用）。
- フロントは `VITE_GAS_PROXY_URL` を `.env` で受け取り、本番は GitHub Actions Secrets から注入。

### 5-2. `src/api/claude.js`

```
generateBatch({ steps, count = 5 }) -> Promise<Item[]>
```

- `prompts/generate.js` で system/user を組み立て、`POST {VITE_GAS_PROXY_URL}` に以下を送る:
  ```jsonc
  {
    "model": "claude-sonnet-4-5",      // 既存トレーナーと同じ文字列に揃える（grading-prompt.md 準拠）
    "max_tokens": 8192,
    "system": "<shared.js の system 文>",
    "messages": [
      { "role": "user", "content": "<generate.js の user 文>" },
      { "role": "assistant", "content": "[" }   // prefill
    ]
  }
  ```
- レスポンスの `content[0].text` を `'[' +` で連結してJSONパース → `validateItems()`（§7）→ 5件に満たなければ不足分のみ**最大1回**再リクエスト。

### 5-3. `src/prompts/shared.js`（system）

`question-trainer-requirements-design.md §7-2` の system 文を**そのまま**実装する。要点（省略不可）:
- JSONのみ・`『』`で英文引用・`"` 禁止・末尾カンマ禁止・改行は `\n`
- 1文1疑問詞
- 糸1の3機構（be / 既存助動詞 / do挿入）の使い分け、be・既存助動詞があるとき do を使わない
- 主語wh は糸1を起動しない（時制は本動詞活用）
- 間接疑問は従属節の糸1解除（do消し平叙語順、疑問詞は節頭保持）
- 複雑な関係詞修飾で飾らない
- 一意性: `targetGap` を1つに固定、when/where/why/how は `answerSense` も固定し日本語を一意に書く

### 5-4. `src/prompts/generate.js`（user）

`§7-3` の user テンプレートを実装。`{{STEPS}}`・`{{STEP_DEFS}}`・`{{SCENE_POOL}}` を `constants/` から注入:
- `STEP_DEFS`: 選択STEPの「観点・例・糸・targetGap候補」を `steps.js` から
- `SCENE_POOL`: `scenePool.js`（structure-map §9 の A/B/B'/C）から
- 時制は `coreTenses.js`（現在/過去/be/未来/現在完了）から各問へ散らす指示
- 返却JSONスキーマは §6 のItemと一致

---

## 6. データモデル

### 6-1. Item スキーマ（生成APIの返却要素）— `requirements-design §5-1` と同一

```jsonc
{
  "id":"q1","step":3,"sceneTag":"道聞き","functionTag":"情報を得る",
  "jp":"…","targetGap":"where","answerSense":null,
  "en":"…","nuance":"…","thread":"糸1+糸2","answerSentence":null,
  "parts":[{"role":"X|V|Y|Z","text":"…","note":"…"}]
}
```

### 6-2. `constants/steps.js`（structure-map §8-1 ミラー）

```js
export const STEPS = {
  1:{ name:"Yes/No 疑問文", desc:"糸1のみ・3機構を回す", thread:"糸1",
      gapCandidates:["yesno"] },
  2:{ name:"wh・主語を聞く", desc:"糸2のみ・糸1なし", thread:"糸2",
      gapCandidates:["subject"] },
  3:{ name:"wh・主語以外を聞く", desc:"糸1 + 糸2", thread:"糸1+糸2",
      gapCandidates:["object","complement","when","where","why","how"] },
  4:{ name:"副詞wh ＋ 答え文", desc:"when/where/why/how + 答え", thread:"糸1+糸2",
      gapCandidates:["when","where","why","how"], requireAnswerSentence:true },
  5:{ name:"限定詞型・前置詞残留", desc:"Which book / Who…with?", thread:"糸1+糸2",
      gapCandidates:["which+名詞","what+名詞","whose+名詞","前置詞残留"] },
  6:{ name:"間接疑問", desc:"糸1解除・二重疑問構造", thread:"糸1解除",
      gapCandidates:["従属節gap","疑問詞+to不定詞"] },
  7:{ name:"選択・否定疑問", desc:"or B? / Don't you…?", thread:"糸1",
      gapCandidates:["alternative","negative"] },
};
export const ANSWER_SENSE = {
  why:["cause","purpose"], how:["means","manner","state","degree"],
  when:["point","clause"], where:["point","clause"],
};
```

### 6-3. `constants/scenePool.js`（structure-map §9）

A（生活者共通）/ B（ペルソナ）/ B'（ロジカルシンキング：語学学校・自己将来）/ C（機能軸）を配列で持つ。**MECE非保証・重複容認**のコメントを必ず残す。仮定法系（What would you do if…）は `layer:2` フラグで初版除外。

---

## 7. バリデーション — `src/utils/validateItems.js`（requirements-design §8）

各Itemに対し軽量な構文チェックを行い、違反は除外して再要求対象にする。

```
validateItems(items, selectedSteps) -> { valid:Item[], invalidCount:number }
```

| 検査 | 失敗条件（除外） |
|---|---|
| 疑問詞1つ | `en` のwh語が2つ以上（間接の従属節whは1つまで許容） |
| do挿入の排他 | `en` に do/does/did と be/既存助動詞の前置が共起 |
| 主語whの糸1禁止 | `targetGap==="subject"` で先頭に do/be/助動詞前置がある |
| 間接の糸1解除 | `step===6` で従属節が疑問詞直後に助動詞前置（平叙語順でない） |
| 末尾? | `en` が `?` で終わらない（→整形 or 除外） |
| メタ必須 | `targetGap` 無し、または when/where/why/how で `answerSense` 無し |
| STEP整合 | `step` が `selectedSteps` に含まれない |

> 完全な構文解析は不要。正規表現＋語リストの軽量判定でよい。目的は「明白な型崩れの排除」。

---

## 8. UI / 状態機械 — `src/App.jsx`

`question-trainer-prototype.html` を**視覚的正本**としてReact化する。配色・余白・コンポーネント構成・織機モチーフ・糸タグ配色を再現すること。

フェーズ状態機械（プロトタイプの `phase` 0–3 と同一）:

```
select → answer → review → export
  │        │         │        │
  │        │         │        └ 「次の5問」→ generateBatch() → answer（=新規1コール）
  │        │         └ 「MDに書き出す」
  │        └ 「答え合わせ」（模範解答を開示）※API追加なし
  └ 「出題する(5問)」→ generateBatch()（1コール）
```

- `mode`（step|combined）、`selectedSteps:Set`、`items:Item[]`、`attempts:{id:string}` を state で保持。
- 総合モードは選択STEP集合から**完全ランダム**でSTEPを割当て（プロトタイプの `generate()` と同じ）。
- 出題フェーズでは模範解答を**描画しない**（DOMに出さない）。開示は review フェーズで。
- localStorage 等の永続化は使わない（v1ステートレス）。

---

## 9. MDエクスポート — `src/utils/formatExportMarkdown.js`（requirements-design §10）

ファイル名 `question-trainer_{mode}_{steps}_{yyyymmdd-hhmm}.md`。テンプレは §10 のとおり。`nuance` の `『』` は保持、HTMLタグ（`<b>` 等）が混ざる場合は除去。各問に `STEP / sceneTag / functionTag / targetGap / answerSense / 自分の回答 / 模範解答 / 答え文 / nuance / 構造分解 / 糸` を含める（欠落させない）。

---

## 10. ビルド / デプロイ

- `vite.config.js`: `base: '/English-Question-Trainer/'`
- `.github/workflows/deploy.yml`: 構造トレーナーのものを流用し、`VITE_GAS_PROXY_URL` を Secrets から build 時に注入。
- `package.json`: React/Vite の依存を踏襲。新規依存は増やさない方針（必要なら理由を添えて提案）。

---

## 11. prompt-dumps / scripts

- `scripts/dump-prompts.mjs`: STEP 1〜7 それぞれで `buildGeneratePrompt({steps:[n]})` を評価し `prompt-dumps/generate/stepN.md` に system+user を書き出す。総合例も `combined.md` に。
- 目的: プロンプトをGit管理し、デスクトップClaudeでの手動検証・レビューに使えるようにする（構造トレーナーと同じ運用）。

---

## 12. 受け入れ条件（Acceptance Criteria）

- [ ] STEP個別／総合（選択STEP集合から完全ランダム）で**5問**出題できる
- [ ] 1セッションのClaude呼び出しが**1回**（生成のみ。採点コールがない）
- [ ] 問題と模範解答が**同一レスポンス**で返る（セット生成）
- [ ] 出題フェーズで模範解答がDOMに存在しない／reviewで開示される
- [ ] 全Itemが §7 バリデーションを通過（違反は除外・最大1回再要求）
- [ ] 各Itemに `targetGap`、when/where/why/how には `answerSense` が入る
- [ ] STEP4で `answerSentence`（模範の答え文）が表示・MD出力される
- [ ] MDが §9 テンプレで出力され、メタデータが欠落しない
- [ ] APIキーがフロント／ビルド成果物に露出しない（GAS Script Properties 管理）
- [ ] UIがプロトタイプHTMLを再現（配色・糸タグ・織機モチーフ・4フェーズ）
- [ ] GitHub Pages（base path）で動作

---

## 13. 推奨実装順序（PR分割）

1. **PR1 雛形**: Vite+React 雛形、`vite.config`/`deploy.yml`/`index.html`、設計ドキュメントをルート配置。
2. **PR2 定数**: `steps.js` / `scenePool.js` / `roles.js` / `coreTenses.js`。
3. **PR3 プロンプト**: `shared.js` / `generate.js` / `dump-prompts.mjs` ＋ `prompt-dumps/` 生成。
4. **PR4 API**: `gas/proxy.gs` ＋ `api/claude.js`（モックfallback付き）＋ `validateItems.js`。
5. **PR5 UI**: プロトタイプのReact化（select→answer→review→export）。
6. **PR6 エクスポート**: `formatExportMarkdown.js` ＋ `ExportPanel`。
7. **PR7 結合**: 実APIで5問→答え合わせ→MDの一気通貫、受け入れ条件チェック。

---

## 14. ドリフト防止チェックリスト（PRごとに確認）

- [ ] 関数名・定数名・スキーマを本書/正本から改名していない
- [ ] 生成は1コール・セット生成のまま（採点コールを足していない）
- [ ] system/user プロンプトを要約・省略していない
- [ ] バリデーション条件を緩めていない
- [ ] 既存トレーナーの流用部は**実コードを確認**してから移植した
- [ ] APIキーがどこにも平文で入っていない
