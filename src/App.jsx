import { useCallback, useMemo, useState } from 'react';
import { generateBatch, isUsingMock, QUESTIONS_PER_SESSION } from './api/claude.js';
import { Header } from './components/Header.jsx';
import { ProgressRail } from './components/ProgressRail.jsx';
import { ModeToggle } from './components/ModeToggle.jsx';
import { StepSelect } from './components/StepSelect.jsx';
import { QuestionCard } from './components/QuestionCard.jsx';
import { ReviewCard } from './components/ReviewCard.jsx';
import { ExportPanel } from './components/ExportPanel.jsx';
import { formatExportMarkdown } from './utils/formatExportMarkdown.js';

const PHASE_TAGS = ['01 · select', '02 · answer', '03 · review', '04 · export'];

export default function App() {
  const [mode, setMode] = useState('step');
  const [selectedSteps, setSelectedSteps] = useState(new Set([1]));
  const [phase, setPhase] = useState(0);
  const [items, setItems] = useState([]);
  const [attempts, setAttempts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shortfall, setShortfall] = useState(0);

  const selectedArray = useMemo(() => [...selectedSteps].sort((a, b) => a - b), [selectedSteps]);

  const exportData = useMemo(() => {
    if (items.length === 0) return { markdown: '', filename: 'question-trainer.md' };
    return formatExportMarkdown({
      mode,
      selectedSteps: selectedArray,
      items,
      attempts,
    });
  }, [mode, selectedArray, items, attempts]);

  const handleModeChange = useCallback((next) => {
    setMode(next);
    if (next === 'step' && selectedSteps.size > 1) {
      setSelectedSteps(new Set([selectedArray[0]]));
    }
  }, [selectedArray, selectedSteps.size]);

  const handleToggleStep = useCallback((step, currentMode) => {
    setSelectedSteps((prev) => {
      if (currentMode === 'step') return new Set([step]);
      const next = new Set(prev);
      if (next.has(step)) {
        next.delete(step);
        if (next.size === 0) next.add(step);
      } else {
        next.add(step);
      }
      return next;
    });
  }, []);

  const handleAttemptChange = useCallback((id, value) => {
    setAttempts((prev) => ({ ...prev, [id]: value }));
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const runGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const batch = await generateBatch({ steps: selectedArray });
      if (batch.length === 0) {
        setError('出題を生成できませんでした。もう一度お試しください。');
        return false;
      }
      setItems(batch);
      setAttempts({});
      // 実API利用時に5問に満たなかった場合だけ不足数を保持（モード時は表示しない）
      setShortfall(!isUsingMock() && batch.length < QUESTIONS_PER_SESSION ? batch.length : 0);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '出題に失敗しました');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (phase === 1) setPhase(0);
    else if (phase === 2) setPhase(1);
    else if (phase === 3) setPhase(2);
    scrollTop();
  };

  const next = async () => {
    if (phase === 0) {
      const ok = await runGenerate();
      if (ok) {
        setPhase(1);
        scrollTop();
      }
      return;
    }
    if (phase === 1) {
      setPhase(2);
      scrollTop();
      return;
    }
    if (phase === 2) {
      setPhase(3);
      scrollTop();
      return;
    }
    if (phase === 3) {
      const ok = await runGenerate();
      if (ok) {
        setPhase(1);
        scrollTop();
      }
    }
  };

  const mainDisabled = phase === 0 && selectedSteps.size === 0;
  const mainLabel =
    phase === 0 ? '出題する（5問）' :
    phase === 1 ? '答え合わせ' :
    phase === 2 ? 'MDに書き出す' :
    '次の5問';

  return (
    <>
      {loading && <div className="loading-overlay">出題を生成中…</div>}
      <div className="wrap">
        <Header phaseTag={PHASE_TAGS[phase]} />
        <ProgressRail phase={phase} />

        {isUsingMock() && phase > 0 && (
          <div className="mock-banner">
            デモモード（VITE_GAS_PROXY_URL 未設定）— サンプル問題を表示中
          </div>
        )}

        {shortfall > 0 && phase > 0 && (
          <div className="mock-banner">
            {QUESTIONS_PER_SESSION}問中 {shortfall}問のみ生成できました。「次の5問」で再生成できます。
          </div>
        )}

        {error && <p className="hint" style={{ color: 'var(--trap)' }}>{error}</p>}

        {phase === 0 && (
          <section>
            <h2 className="title">何を練習する？</h2>
            <p className="sub">
              STEPは〈操作〉の積み上げ。総合モードでは選んだSTEPの中から完全ランダムで出題します（弱点強化用）。
            </p>
            <ModeToggle mode={mode} onChange={handleModeChange} />
            <StepSelect mode={mode} selectedSteps={selectedSteps} onToggle={handleToggleStep} />
          </section>
        )}

        {phase === 1 && (
          <section>
            <h2 className="title">5問を英訳しよう</h2>
            <p className="sub">
              まず5問すべて自力で。模範解答は「答え合わせ」まで出ません（瞬発訓練のため）。
            </p>
            {items.map((item, i) => (
              <QuestionCard
                key={item.id}
                item={item}
                index={i}
                value={attempts[item.id] || ''}
                onChange={handleAttemptChange}
              />
            ))}
          </section>
        )}

        {phase === 2 && (
          <section>
            <h2 className="title">答え合わせ</h2>
            <p className="sub">
              模範解答・ポイント・構造分解（X/Y/Z/V）・糸を確認。AI添削はこの画面では行わず、MDに書き出してデスクトップClaudeへ。
            </p>
            {items.map((item, i) => (
              <ReviewCard
                key={item.id}
                item={item}
                index={i}
                attempt={attempts[item.id]}
              />
            ))}
          </section>
        )}

        {phase === 3 && (
          <section>
            <h2 className="title">MDに書き出す</h2>
            <p className="sub">
              問題・自分の回答・模範解答・メタデータを同梱。これをデスクトップClaudeのProjectsに投げると、添削が安定します。
            </p>
            <ExportPanel markdown={exportData.markdown} filename={exportData.filename} />
          </section>
        )}
      </div>

      <div className="bar">
        <div className="bar-inner">
          <div className="note-1api">
            <span className="dot" />
            1セッション = Claude API 1コール（問題＋模範解答をセット生成）
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {phase > 0 && (
              <button type="button" className="btn ghost" onClick={goBack}>
                戻る
              </button>
            )}
            <button
              type="button"
              className="btn primary"
              disabled={mainDisabled || loading}
              onClick={next}
            >
              {mainLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
