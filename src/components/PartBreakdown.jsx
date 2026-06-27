import { normalizePart } from '../utils/parts.js';

export function PartBreakdown({ parts }) {
  const normalized = (parts ?? []).map(normalizePart).filter(Boolean);
  if (normalized.length === 0) return null;

  return (
    <div className="parts">
      <span className="plabel">構造分解</span>
      {normalized.map((p, i) => (
        <span key={i} className="part">
          <span className={`role ${p.role}`}>{p.role}</span>
          {p.text}
          <span className="note">{p.note}</span>
        </span>
      ))}
    </div>
  );
}
