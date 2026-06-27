const TAG_CLASS = {
  糸1: 'tt1',
  糸2: 'tt2',
  '糸1+糸2': 'tt2',
  '糸1解除': 'ttx',
};

export function ThreadTag({ thread }) {
  const cls = TAG_CLASS[thread] ?? 'ttm';
  return <span className={`thread-tag ${cls}`}>{thread}</span>;
}
