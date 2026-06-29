import { useMemo, useState } from 'react';
import { formatQuestionMarkdown } from '../utils/formatExportMarkdown.js';
import { isAnswerCorrect, keysToSentence, usedDistractorSources } from '../utils/wordPool.js';

const VERDICT_LABEL = {
  correct: '正解',
  incorrect: '不正解',
  empty: '未入力',
};

export function ReviewCard({ item, index, selectedKeys }) {
  const pool = item.wordPool || [];
  const attemptRaw = keysToSentence(pool, selectedKeys).trim();
  const hasAnswer = Boolean(attemptRaw);
  const correct = hasAnswer && isAnswerCorrect(pool, selectedKeys, item.en);
  const verdict = !hasAnswer ? 'empty' : correct ? 'correct' : 'incorrect';
  const mine = attemptRaw || '（未入力）';
  const [copied, setCopied] = useState(false);

  const usedTrapSources = useMemo(
    () => usedDistractorSources(pool, selectedKeys),
    [pool, selectedKeys],
  );

  const { markdown } = formatQuestionMarkdown(item, selectedKeys);

  async function copyMd() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // クリップボード不可の環境では手動コピーが必要
    }
  }

  return (
    <div className={`qcard qcard-${verdict}`}>
      <div className="qhead">
        <span className="qnum">Q{index + 1}</span>
        <span className={`verdict-badge ${verdict}`}>{VERDICT_LABEL[verdict]}</span>
      </div>
      <div className="jp">{item.jp}</div>
      <div className={`reveal verdict-${verdict}`}>
        <div className={`ans-row answer-${verdict}`}>
          <span className="lab">自分の回答</span>
          <span className="val mine">{mine}</span>
        </div>
        <div className="ans-row">
          <span className="lab">模範解答（質問文）</span>
          <span className="val model">{item.en}</span>
        </div>
        {item.answerSentence && (
          <div className="ans-row">
            <span className="lab">模範解答（回答文）</span>
            <span className="val answer-sentence">{item.answerSentence}</span>
          </div>
        )}

        {item.distractors?.length > 0 && (
          <div className="distractor-section">
            <div className="distractor-heading">単語プールの誤答誘導語 — 模範解答で使わない理由</div>
            {item.distractors.map((dist, i) => {
              const source = `distractor-${i}`;
              const picked = usedTrapSources.has(source);
              return (
                <div key={dist.label} className={`distractor-card${picked ? ' picked' : ''}`}>
                  <div className="distractor-top">
                    <span className="distractor-label">{dist.label}</span>
                    <span className="distractor-words">{dist.words.join(' ')}</span>
                    {picked && <span className="distractor-badge">回答に使用</span>}
                  </div>
                  <p className="distractor-reason">{dist.reason}</p>
                </div>
              );
            })}
          </div>
        )}

        {item.nuance && (
          <div className="nuance">
            <b>模範解答のポイント</b> — {item.nuance}
          </div>
        )}

        <div className="card-actions">
          <button type="button" className="btn primary sm" onClick={copyMd}>
            {copied ? 'コピーしました ✓' : 'この問題をMarkdownで出力（コピー）'}
          </button>
        </div>
      </div>
    </div>
  );
}
