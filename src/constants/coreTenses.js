export const CORE_TENSES = [
  { id: 'present', label: '現在（do/does）' },
  { id: 'past', label: '過去（did）' },
  { id: 'be', label: 'be（is/are/was/were）' },
  { id: 'future', label: '未来（will）' },
  { id: 'perfect', label: '現在完了（have/has）' },
];

export function getCoreTensesText() {
  return CORE_TENSES.map((t) => `- ${t.label}`).join('\n');
}
