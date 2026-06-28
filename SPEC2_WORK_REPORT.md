# 疑問文トレーナー — 仕様更新（spec2）作業報告

> **作業日**: 2026-06-28  
> **依頼元**: `qt-spec2-cursor-request.md`  
> **正本**: `question-trainer-requirements-design.md`（§5-3 / §6 / §7 / §10 更新版）  
> **対象リポジトリ**: https://github.com/nkhippo/English-Question-Trainer  
> **デプロイ先**: https://nkhippo.github.io/English-Question-Trainer/

---

## 作業概要

3つの仕様変更を一括実施した。

| # | 内容 | 主な変更 |
|---|---|---|
| ① | 用語の平易化 | STEP名・説明・プロンプト出力を平易日本語に。画面・MDから「糸」「X/Y/Z/V」を撤去 |
| ② | 1問ずつMD出力 | 一括エクスポート画面を廃止し、答え合わせカードごとに貼付プロンプト形式MDをコピー/DL |
| ③ | 表示の最小化 | 答え合わせは「自分の回答／模範（質問文・回答文）／MDボタン」のみ。4→3フェーズ |

---

## 変更ファイル一覧

| 種別 | ファイル |
|---|---|
| 全文差替 | `src/constants/steps.js` |
| 全文差替 | `src/components/StepSelect.jsx` |
| 全文差替 | `src/components/ProgressRail.jsx` |
| 全文差替 | `src/components/ReviewCard.jsx` |
| 全文差替 | `src/utils/formatExportMarkdown.js` |
| FIND/REPLACE | `src/App.jsx` |
| FIND/REPLACE | `src/prompts/shared.js` |
| FIND/REPLACE | `src/prompts/generate.js` |
| 追記 | `src/App.css` |
| 削除 | `src/components/ThreadTag.jsx` |
| 削除 | `src/components/ExportPanel.jsx` |
| 更新 | `question-trainer-requirements-design.md` |
| 再生成 | `prompt-dumps/generate/*.md` |

---

## ① 用語の平易化

### 画面

- STEPカード: 操作タグ（`ThreadTag`）を撤去。番号・名前・説明・チェックのみ
- STEP名・説明を平易表記に変更（例: 「wh・主語以外を聞く」→「主語以外をたずねる疑問文」）
- 選択画面・答え合わせ画面の説明文から独自用語を除去

### プロンプト

- `shared.js`: nuance/note は平易日本語で書くルールを追加
- `generate.js`: STEP定義注入から `糸:` を除去。nuance/note ルールを平易化

### 内部コード

- `thread` / `role` は JSON フィールドに維持（生成・バリデーション用）
- 表示・MD出力時のみ `GAP_PLAIN` / `ROLE_PLAIN` / `stripJargon()` で変換

---

## ② 1問ずつMD出力（貼付プロンプト形式）

### 廃止

- フェーズ4「MDに書き出す」画面
- `ExportPanel.jsx` コンポーネント
- 一括 `formatExportMarkdown()` 関数

### 新設

- `formatQuestionMarkdown(item, attempt)` — 1問ぶんのMD生成
- `ReviewCard` に「この問題をMDで出力（コピー）」＋「ダウンロード」ボタン

### MD形式（§10 準拠）

Projects に貼るだけで次の3点をClaudeに解説させる指示文を内包:

1. 私の回答の添削
2. 模範解答がなぜ正しいのか
3. その他の表現方法

参考セクションに「出題のねらい」「模範解答のポイント」「文の組み立て」を平易表記で同梱。

---

## ③ 表示の最小化・3フェーズ化

### フェーズ遷移

```
select → answer → review
  │        │         │
  │        │         └ 「次の5問」→ 再生成 → answer
  │        └ 「答え合わせ」
  └ 「出題する（5問）」
```

- 進捗バー: 4セグメント → **3セグメント**
- review画面の主ボタン: **「次の5問」**（旧: 「MDに書き出す」→別フェーズ）

### 答え合わせカードの表示要素

- 自分の回答
- 模範解答（質問文）
- 模範解答（回答文）— 該当STEPのみ
- MD出力ボタン

**非表示**（MDの参考セクションに回す）: nuance・targetGapメタ・構造分解・操作タグ

---

## 検証結果

| 項目 | 結果 |
|---|---|
| `npm run build` | ✅ 成功 |
| `npm run dump-prompts` | ✅ 成功（プロンプトダンプ再生成） |
| 画面に「糸」「X/Y/Z/V」が出ない | ✅（`src/components`・`App.jsx` の表示文言を確認） |
| MD出力に独自用語が出ない | ✅（`stripJargon` で糸系を平易化。役割は「名詞/動詞/副詞」表記） |
| 貼付プロンプト形式 | ✅（3点解説指示＋出題/回答/模範/参考セクション） |

---

## デプロイ

- ブランチ: `main`
- GitHub Actions により自動デプロイ
- 公開 URL: https://nkhippo.github.io/English-Question-Trainer/

---

## コミットメッセージ

```
feat: サイト表示・MD出力から独自用語(糸/XYZ)を撤去し平易表記に / MD出力を1問ずつの貼付プロンプト形式に変更(添削・模範の理由・別表現を内包) / 答え合わせ画面の表示を最小要素に簡素化(エクスポート画面を廃止)
```
