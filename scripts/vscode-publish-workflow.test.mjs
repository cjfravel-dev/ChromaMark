import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/vscode-publish.yml', import.meta.url), 'utf8');

test('VS Code publishing uses GitHub OIDC and no PAT secret', () => {
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /environment:\s*vscode-marketplace/);
  assert.match(workflow, /uses:\s*azure\/login@v2/);
  assert.match(workflow, /client-id:\s*\$\{\{\s*vars\.AZURE_CLIENT_ID\s*\}\}/);
  assert.match(workflow, /vsce publish --azure-credential/);
  assert.doesNotMatch(workflow, /VSCE_PAT|--pat|secrets\./);
});

test('VS Code workflow supports release publishing and manual identity bootstrap', () => {
  assert.match(workflow, /release:\s*\n\s*types:\s*\[published\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /identity/);
  assert.match(workflow, /app\.vssps\.visualstudio\.com\/_apis\/profile\/profiles\/me/);
  assert.match(workflow, /499b84ac-1321-427f-aa17-267ca6975798/);
});

test('VS Code publish job rebuilds, tests, packages, and skips duplicate versions', () => {
  assert.match(workflow, /npm run build --workspace @chromamark\/renderer/);
  assert.match(workflow, /npm run build --workspace chromamark-vscode/);
  assert.match(workflow, /npm test --workspace chromamark-vscode/);
  assert.match(workflow, /npm run package --workspace chromamark-vscode/);
  assert.match(workflow, /--packagePath "\$vsix" --skip-duplicate/);
});
