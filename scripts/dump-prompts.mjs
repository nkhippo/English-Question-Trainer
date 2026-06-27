/**
 * Dump rendered generate prompts for Steps 1–7.
 * Usage: npm run dump-prompts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildGeneratePrompt } from '../src/prompts/generate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATE_DIR = path.join(__dirname, '..', 'prompt-dumps', 'generate');

function formatMdBlock(title, text) {
  return `## ${title}\n\n\`\`\`\n${text}\n\`\`\``;
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('wrote', filePath);
}

for (let step = 1; step <= 7; step++) {
  const { system, user } = buildGeneratePrompt({ steps: [step] });
  const content = `# Step ${step} — 問題生成

- 生成元: \`buildGeneratePrompt()\` in \`src/prompts/generate.js\`
- 対象STEP: ${step}

${formatMdBlock('System', system)}

${formatMdBlock('User', user)}
`;
  writeFile(path.join(GENERATE_DIR, `step${step}.md`), content);
}

const combinedSteps = [1, 3, 4, 6];
const { system: cSystem, user: cUser } = buildGeneratePrompt({ steps: combinedSteps });
const combinedContent = `# 総合モード例 — 問題生成

- 生成元: \`buildGeneratePrompt()\`
- 対象STEP: ${combinedSteps.join(', ')}

${formatMdBlock('System', cSystem)}

${formatMdBlock('User', cUser)}
`;
writeFile(path.join(GENERATE_DIR, 'combined.md'), combinedContent);

console.log('\nDone.');
