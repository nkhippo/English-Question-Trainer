import { STEPS } from '../constants/steps.js';

export function QuestionCard({ item, index, value, onChange }) {
  const stepInfo = STEPS[item.step];
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
      <textarea
        placeholder="英訳を入力…"
        value={value}
        onChange={(e) => onChange(item.id, e.target.value)}
      />
    </div>
  );
}
