import { STEPS } from '../constants/steps.js';

export function StepSelect({ mode, selectedSteps, onToggle }) {
  return (
    <div className="steps">
      {Object.entries(STEPS).map(([key, step]) => {
        const n = Number(key);
        const sel = selectedSteps.has(n);
        return (
          <button
            key={n}
            type="button"
            className={`step${sel ? ' sel' : ''}`}
            onClick={() => onToggle(n, mode)}
          >
            <span className="no">{n}</span>
            <span className="body">
              <span className="nm">{step.name}</span>
              <span className="ds">{step.desc}</span>
            </span>
            <span className="check" />
          </button>
        );
      })}
    </div>
  );
}
