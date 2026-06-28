import { useMemo } from 'react';
import { keysToSentence, tokenForSentence } from '../utils/wordPool.js';

function selectedLabels(pool, selectedKeys) {
  let capitalizeNext = true;
  return (selectedKeys || []).map((key) => {
    const entry = pool.find((e) => e.key === key);
    if (!entry) return null;
    let label = entry.text;
    if (/[a-zA-Z]/.test(entry.text)) {
      label = tokenForSentence(entry.text, capitalizeNext);
      capitalizeNext = false;
    }
    return { key, label };
  }).filter(Boolean);
}

export function QuestionCard({ item, index, selectedKeys, onChange }) {
  const pool = item.wordPool || [];

  const usedKeys = useMemo(() => new Set(selectedKeys || []), [selectedKeys]);
  const available = pool.filter((e) => !usedKeys.has(e.key));
  const built = keysToSentence(pool, selectedKeys);
  const chips = useMemo(
    () => selectedLabels(pool, selectedKeys),
    [pool, selectedKeys],
  );

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
      </div>
      <div className="jp">{item.jp}</div>

      <div className="sentence-builder">
        <div className="builder-label">あなたの英文</div>
        <div className={`built-sentence${built ? '' : ' empty'}`}>
          {built || '下の単語を順にタップして並べよう'}
        </div>
        {selectedKeys?.length > 0 && (
          <div className="built-chips">
            {chips.map(({ key, label }, i) => (
                <button
                  key={`${key}-${i}`}
                  type="button"
                  className="word-chip selected"
                  onClick={() => unpick(key)}
                  title="タップで戻す"
                >
                  {label}
                </button>
              ))}
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
