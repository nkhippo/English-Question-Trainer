import { useMemo } from 'react';
import { STEPS } from '../constants/steps.js';
import { keysToSentence } from '../utils/wordPool.js';

export function QuestionCard({ item, index, selectedKeys, onChange }) {
  const stepInfo = STEPS[item.step];
  const pool = item.wordPool || [];

  const usedKeys = useMemo(() => new Set(selectedKeys || []), [selectedKeys]);
  const available = pool.filter((e) => !usedKeys.has(e.key));
  const built = keysToSentence(pool, selectedKeys);

  function pick(key) {
    onChange(item.id, [...(selectedKeys || []), key]);
  }

  function unpick(key) {
    const keys = [...(selectedKeys || [])];
    const idx = keys.lastIndexOf(key);
    if (idx === -1) return;
    keys.splice(idx, 1);
    onChange(item.id, keys);
  }

  function clearAll() {
    onChange(item.id, []);
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

      <div className="sentence-builder">
        <div className="builder-label">あなたの英文</div>
        <div className={`built-sentence${built ? '' : ' empty'}`}>
          {built || '下の単語を順にタップして並べよう'}
        </div>
        {selectedKeys?.length > 0 && (
          <div className="built-chips">
            {selectedKeys.map((key, i) => {
              const entry = pool.find((e) => e.key === key);
              if (!entry) return null;
              return (
                <button
                  key={`${key}-${i}`}
                  type="button"
                  className="word-chip selected"
                  onClick={() => unpick(key)}
                  title="タップで戻す"
                >
                  {entry.text}
                </button>
              );
            })}
            <button type="button" className="clear-link" onClick={clearAll}>
              クリア
            </button>
          </div>
        )}
      </div>

      <div className="word-pool">
        <div className="builder-label">単語プール（A→Z）</div>
        <div className="pool-chips">
          {available.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className="word-chip pool"
              onClick={() => pick(entry.key)}
            >
              {entry.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
