# 疑問文トレーナー — バリデーション/フォールバック修正 作業報告

> **作業日**: 2026-06-28  
> **依頼元**: `qt-cursor-fix-request.md`  
> **対象リポジトリ**: https://github.com/nkhippo/English-Question-Trainer  
> **デプロイ先**: https://nkhippo.github.io/English-Question-Trainer/

---

## 作業概要

`qt-cursor-fix-request.md` に沿い、バグ修正4点を実施した。新規機能の追加はなし。変更ファイルは4件のみ。

| # | 修正内容 | 変更ファイル |
|---|---|---|
| Fix 1 | 実API利用時のモック無言補完を廃止し、不足を表面化 | `src/api/claude.js`, `src/App.jsx` |
| Fix 2 | 疑問詞カウントを STEP 別に厳格化（直接=1 / 間接=2） | `src/utils/validateItems.js` |
| Fix 3 | `nuance` の生HTML挿入を廃止し安全描画 | `src/components/ReviewCard.jsx` |
| Fix 4 | `hasDoWithAux` の誤検知を修正（間接疑問が弾かれる既存バグ） | `src/utils/validateItems.js` |

---

## Fix 1 — 実API利用時のモック無言補完を廃止し、不足を表面化

### 問題

`generateBatch` が実API使用時でも5問に満たないと `generateMockBatch` で静かに補完していた。サンプル問題が「本物の出題」に紛れても気づけない。

### 対応

**`src/api/claude.js`**
- 再要求後の mock 補完ブロックを削除
- 実問のみ（5問未満もあり得る）を返す
- `generateMockBatch` の import はデモモード分岐（`VITE_GAS_PROXY_URL` 未設定時）で引き続き使用

**`src/App.jsx`**
- `QUESTIONS_PER_SESSION` を import
- `shortfall` state を追加
- `runGenerate` で 0件 → エラー表示してフェーズを進めない
- 0 < 件数 < 5 → 進めるが `shortfall` を保持し、不足バナーを表示（デモモード時は出さない）

---

## Fix 2 — 疑問詞カウントを STEP 別に厳格化

### 問題

`countWhWords(en) > 2` で2つまで許容していた。仕様は「高々1つ（間接の従属節whは別扱い）」。

### 対応

```js
const whLimit = step === 6 ? 2 : 1;   // 直接疑問=1、間接(STEP6)のみ2
if (countWhWords(en) > whLimit) { invalidCount++; continue; }
```

---

## Fix 3 — `nuance` の生HTML挿入を廃止し安全描画

### 問題

`ReviewCard` が `dangerouslySetInnerHTML` で `nuance`（生成テキスト）をHTML挿入していた。

### 対応

- `<b>…</b>` のみ `<strong>` に変換する `renderNuance()` を導入
- 他の文字列は React によるエスケープ描画
- `dangerouslySetInnerHTML` を撤去

---

## Fix 4 — `hasDoWithAux` の誤検知を修正 ★重要

### 問題（既存バグ）

「Do you know where the station is?」のような正しい間接疑問を、主節の `Do` と従属節の `is` を「do＋助動詞の誤用」と誤検知して弾いていた。「Did you have lunch?」も `have` を助動詞扱いして誤って弾いていた。STEP6 の有効問が大量に除外され、Fix 1 の不足表面化（＝出題が痩せる）を誘発していた。

### 対応

do挿入が同一節内で be形・法助動詞を直接従える誤用だけを検出する正規表現に変更:

```js
const DO_PLUS_FINITE_AUX =
  /\b(do|does|did)\s+(?:\w+\s+){0,2}?(is|are|am|was|were|been|being|can|could|will|would|shall|should|may|might|must)\b/i;
function hasDoWithAux(en) { return DO_PLUS_FINITE_AUX.test(en); }
```

- 主語は最大2語まで許容
- `have/has/had` は本動詞用法（Did you have lunch?）が正当なので除外
- 従属節の be/助動詞（Do you know where the station is?）を誤検出しない

---

## 検証結果

### ビルド

```
npm run build → 成功
```

### `validateItems` 回帰テスト（8/8 通過）

| 入力（en, step） | 期待 | 結果 |
|---|---|---|
| `What did you buy?` (3) | KEEP | ✅ |
| `Who bought what?` (3) | DROP（直接で疑問詞2つ） | ✅ |
| `Do you know where the station is?` (6) | KEEP（Fix 4） | ✅ |
| `Did you have lunch?` (1) | KEEP（Fix 4） | ✅ |
| `Did you ask what time it is?` (6) | KEEP | ✅ |
| `Do you can swim?` (1) | DROP | ✅ |
| `Does she is going?` (1) | DROP | ✅ |
| `Why did you go?` / answerSense なし (4) | DROP | ✅ |

### UI（手動確認推奨）

- [ ] `VITE_GAS_PROXY_URL` 設定時、生成が5問未満なら不足バナーが出る
- [ ] デモモード時は不足バナーを出さない
- [ ] 答え合わせ画面で `nuance` の `<b>` 強調が `<strong>` として表示される

---

## デプロイ

- ブランチ: `main`
- GitHub Actions: `Deploy to GitHub Pages` workflow により自動デプロイ
- 公開 URL: https://nkhippo.github.io/English-Question-Trainer/

---

## コミットメッセージ

```
fix: 実APIモードのmock無言補完を廃止し不足を表面化 / 疑問詞カウントをSTEP別に厳格化 / nuanceの生HTML描画を撤去 / hasDoWithAuxの間接疑問誤検知を修正
```
