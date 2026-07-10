import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/vscode-publish.yml', import.meta.url), 'utf8');
const extensionPackage = JSON.parse(
  readFileSync(new URL('../packages/vscode/package.json', import.meta.url), 'utf8'),
);

test('VS Code publishing uses GitHub OIDC and no PAT secret', () => {
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /environment:\s*vscode-marketplace/);
  assert.match(workflow, /uses:\s*azure\/login@v2/);
  assert.match(workflow, /client-id:\s*\$\{\{\s*vars\.AZURE_CLIENT_ID\s*\}\}/);
  assert.match(workflow, /vsce publish --azure-credential/);
  assert.doesNotMatch(workflow, /VSCE_PAT|--pat/);
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

test('the same VSIX publishes to Open VSX with a pinned CLI and environment token', () => {
  assert.equal(extensionPackage.devDependencies.ovsx, '1.0.2');
  assert.match(workflow, /OVSX_PAT:\s*\$\{\{\s*secrets\.OVSX_PAT\s*\}\}/);
  assert.match(workflow, /npm exec --workspace chromamark-vscode -- ovsx publish/);
  assert.match(workflow, /vsix=\$\(realpath "\$vsix"\)/);
  assert.match(workflow, /--packagePath "\$vsix" --skip-duplicate/);
});
