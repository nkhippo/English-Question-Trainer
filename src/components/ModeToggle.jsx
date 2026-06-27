export function ModeToggle({ mode, onChange }) {
  return (
    <div className="modes">
      <button
        type="button"
        className={mode === 'step' ? 'active' : ''}
        onClick={() => onChange('step')}
      >
        STEP個別
      </button>
      <button
        type="button"
        className={mode === 'combined' ? 'active' : ''}
        onClick={() => onChange('combined')}
      >
        総合（複数選択）
      </button>
    </div>
  );
}
