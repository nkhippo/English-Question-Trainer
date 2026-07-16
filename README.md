---
id: pj-2026-06-28-8bc6
aliases:
- pj-2026-06-28-8bc6
title: English Question Trainer（疑問文トレーナー）
created: '2026-06-28'
---
# English Question Trainer（疑問文トレーナー）

疑問文の瞬発産出を鍛える React + Vite アプリ。日本語提示 → 英訳入力 → 模範解答＋根拠の表示 → MDエクスポート。

**GitHub Pages:** https://nkhippo.github.io/English-Question-Trainer/

## スタック

- React 18 + Vite 6
- GitHub Pages デプロイ（`.github/workflows/deploy.yml`）
- Claude API（Google Apps Script プロキシ経由、1セッション1コール）

## 開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

本番ビルドでは `VITE_GAS_PROXY_URL` に GAS ウェブアプリ URL を設定する。未設定時はプロトタイプ由来のモック問題で動作する。

フロントから GAS へは `Content-Type: text/plain` で POST する（`application/json` だと CORS プリフライトでブロックされる）。

## GAS プロキシ

1. `gas/proxy.gs` を Google Apps Script にコピー
2. Script Properties に `CLAUDE_API_KEY` を設定
3. ウェブアプリとしてデプロイ（実行ユーザー=自分、アクセス=全員）
4. デプロイ URL を GitHub Secrets の `VITE_GAS_PROXY_URL` に登録

## 設計ドキュメント（正本）

| ファイル | 内容 |
|---|---|
| `question-trainer-requirements-design.md` | 要件・設計 |
| `question-trainer-structure-map.md` | 構造マップ・STEP定義 |
| `question-trainer-decision-tree.svg` | 生成ロジック分岐図 |
| `question-trainer-prototype.html` | UI視覚的正本 |
| `question-trainer-cursor-work-request.md` | 実装引き渡し |
| `WORK_REPORT.md` | Questions アプリ（旧 HTML 版）改修レポート |

## プロンプトダンプ

```bash
npm run dump-prompts
```

`prompt-dumps/generate/` に各 STEP の生成プロンプトを出力する。
