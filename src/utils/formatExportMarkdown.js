import { STEPS } from '../constants/steps.js';
import { formatPartsLine, normalizePart } from './parts.js';

function stripHtml(text) {
  return String(text).replace(/<[^>]+>/g, '');
}

function formatTimestamp() {
  return new Date().toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatFilenameStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/**
 * @param {{
 *   mode: 'step' | 'combined',
 *   selectedSteps: number[],
 *   items: object[],
 *   attempts: Record<string, string>,
 * }} params
 */
export function formatExportMarkdown({ mode, selectedSteps, items, attempts }) {
  const modeLabel = mode === 'step' ? 'STEP個別' : '総合';
  const stepsLabel = [...selectedSteps].sort((a, b) => a - b).join(', ');
  const stamp = formatTimestamp();

  const lines = [
    `# 疑問文トレーナー 答え合わせ ${stamp}`,
    `- モード: ${modeLabel} ／ 対象STEP: ${stepsLabel}`,
    '',
  ];

  items.forEach((it, i) => {
    const stepInfo = STEPS[it.step];
    const mine = (attempts[it.id] || '').trim() || '（未入力）';
    const parts = (it.parts || []).map(normalizePart).filter(Boolean);
    const partsLine = formatPartsLine(parts);

    lines.push(`## 問題 ${i + 1} / STEP${it.step}（${stepInfo?.name ?? ''}）`);
    lines.push(`- 日本語: ${it.jp}`);
    lines.push(`- シーン: ${it.sceneTag || '—'} ／ 機能: ${it.functionTag || '—'}`);
    lines.push(`- targetGap: ${it.targetGap} ／ answerSense: ${it.answerSense || '—'}`);
    lines.push(`- 自分の回答: ${mine}`);
    lines.push(`- 模範解答: ${it.en}`);
    lines.push(`- 模範の答え文: ${it.answerSentence || '—'}`);
    lines.push(`- 模範のポイント: ${stripHtml(it.nuance || '')}`);
    lines.push(`- 構造分解: ${partsLine || '—'}`);
    lines.push(`- 糸: ${it.thread || '—'}`);
    lines.push('');
  });

  return {
    markdown: lines.join('\n').trimEnd() + '\n',
    filename: `question-trainer_${mode}_${stepsLabel.replace(/,\s*/g, '-')}_${formatFilenameStamp()}.md`,
  };
}
