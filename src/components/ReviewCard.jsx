import { PartBreakdown } from './PartBreakdown.jsx';
import { STEPS } from '../constants/steps.js';

const SENSE_GAPS = new Set(['why', 'how', 'where', 'when']);

function formatNuance(html) {
  return { __html: html };
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
        <div className="nuance" dangerouslySetInnerHTML={formatNuance(`<b>ポイント</b>　${item.nuance}`)} />
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
