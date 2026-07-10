import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'coverage/**',
      'node_modules/**',
      '**/.venv/**',
      'packages/renderer/dist/**',
      'packages/vscode/dist/**',
      '_site/**',
    ],
  },
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-control-regex': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
