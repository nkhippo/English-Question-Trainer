import { useMemo, useState } from 'react';
import { STEPS } from '../constants/steps.js';
import { formatQuestionMarkdown } from '../utils/formatExportMarkdown.js';
import { keysToSentence, usedDistractorSources } from '../utils/wordPool.js';

export function ReviewCard({ item, index, selectedKeys }) {
  const stepInfo = STEPS[item.step];
  const pool = item.wordPool || [];
  const mine = keysToSentence(pool, selectedKeys).trim() || '（未入力）';
  const [copied, setCopied] = useState(false);

  const usedTrapSources = useMemo(
    () => usedDistractorSources(pool, selectedKeys),
    [pool, selectedKeys],
  );

  const { markdown, filename } = formatQuestionMarkdown(item, selectedKeys);

  async function copyMd() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // クリップボード不可の環境はダウンロードで代替できる
    }
  }

  function downloadMd() {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="qcard">
      <div className="qhead">
        <span className="qnum">Q{index + 1}</span>
        <span className="pill">
          STEP{item.step} · {stepInfo?.name}
        </span>
        <span className="pill">{item.sceneTag}</span>
      </div>
      <div className="jp">{item.jp}</div>
      <div className="reveal">
        <div className="ans-row">
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
            {copied ? 'コピーしました ✓' : 'この問題をMDで出力（コピー）'}
          </button>
          <button type="button" className="btn ghost sm" onClick={downloadMd}>
            ダウンロード
          </button>
        </div>
      </div>
    </div>
  );
}
