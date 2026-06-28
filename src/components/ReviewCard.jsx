import { PartBreakdown } from './PartBreakdown.jsx';
import { STEPS } from '../constants/steps.js';

const SENSE_GAPS = new Set(['why', 'how', 'where', 'when']);

// nuance には模範解答の根拠が入り、<b>…</b> による強調が混じりうる。
// 生のHTML挿入（dangerouslySetInnerHTML）を避け、<b> だけを <strong> に変換し
// 他はすべてプレーンテキストとして React にエスケープさせる。
function renderNuance(text) {
  const segments = String(text).split(/(<\/?b>)/i);
  const nodes = [];
  let bold = false;
  segments.forEach((seg, i) => {
    if (/^<b>$/i.test(seg)) { bold = true; return; }
    if (/^<\/b>$/i.test(seg)) { bold = false; return; }
    if (!seg) return;
    nodes.push(bold ? <strong key={i}>{seg}</strong> : <span key={i}>{seg}</span>);
  });
  return nodes;
}

export function ReviewCard({ item, index, attempt }) {
  const stepInfo = STEPS[item.step];
  const mine = (attempt || '').trim() || '（未入力）';
  const senseTrap = SENSE_GAPS.has(item.targetGap);

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
          <span className="lab">模範解答</span>
          <span className="val model">{item.en}</span>
        </div>
        {item.answerSentence && (
          <div className="ans-row">
            <span className="lab">答え文</span>
            <span className="val answer-sentence">{item.answerSentence}</span>
          </div>
        )}
        <div className="nuance"><strong>ポイント</strong>　{renderNuance(item.nuance)}</div>
        <div className="meta">
          <span className="m">targetGap: {item.targetGap}</span>
          <span className={`m${senseTrap ? ' trap' : ''}`}>
            answerSense: {item.answerSense || '—'}
          </span>
          <span className="m">糸: {item.thread}</span>
        </div>
        <PartBreakdown parts={item.parts} />
      </div>
    </div>
  );
}
