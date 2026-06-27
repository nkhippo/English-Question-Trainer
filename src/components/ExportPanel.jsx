import { useState } from 'react';

export function ExportPanel({ markdown, filename }) {
  const [copied, setCopied] = useState(false);

  function download() {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="export-box">
      <pre className="md">{markdown}</pre>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn primary" onClick={download}>
          MDをダウンロード
        </button>
        <button type="button" className="btn ghost" onClick={copy}>
          {copied ? 'コピーしました ✓' : 'クリップボードにコピー'}
        </button>
      </div>
    </div>
  );
}
