import { useCallback, useMemo, useState } from 'react';
import { generateBatch, isUsingMock, QUESTIONS_PER_SESSION } from './api/claude.js';
import { Header } from './components/Header.jsx';
import { ProgressRail } from './components/ProgressRail.jsx';
import { ModeToggle } from './components/ModeToggle.jsx';
import { StepSelect } from './components/StepSelect.jsx';
import { QuestionCard } from './components/QuestionCard.jsx';
import { ReviewCard } from './components/ReviewCard.jsx';

const PHASE_TAGS = ['01 · select', '02 · answer', '03 · review'];

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

  const handleAttemptChange = useCallback((id, selectedKeys) => {
    setAttempts((prev) => ({ ...prev, [id]: selectedKeys }));
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
              STEPは作り方の段階です。総合モードでは選んだSTEPの中から完全ランダムで出題します（弱点強化用）。
            </p>
            <ModeToggle mode={mode} onChange={handleModeChange} />
            <StepSelect mode={mode} selectedSteps={selectedSteps} onToggle={handleToggleStep} />
          </section>
        )}

        {phase === 1 && (
          <section>
            <h2 className="title">5問を英訳しよう</h2>
            <p className="sub">
              単語プールから順にタップして英文を組み立てよう。模範解答は「答え合わせ」まで出ません（瞬発訓練のため）。
            </p>
            {items.map((item, i) => (
              <QuestionCard
                key={item.id}
                item={item}
                index={i}
                selectedKeys={attempts[item.id] || []}
                onChange={handleAttemptChange}
              />
            ))}
          </section>
        )}

        {phase === 2 && (
          <section>
            <h2 className="title">答え合わせ</h2>
            <p className="sub">
              模範解答と照らし合わせよう。誤答誘導語を使った場合は、その理由も確認してね。各問の「MDで出力」でデスクトップClaudeに添削依頼できます。
            </p>
            {items.map((item, i) => (
              <ReviewCard
                key={item.id}
                item={item}
                index={i}
                selectedKeys={attempts[item.id]}
              />
            ))}
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
