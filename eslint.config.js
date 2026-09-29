// ESLint 9 flat config — replaces the legacy .eslintrc.json.
// The old file was ignored by ESLint 9 (which only reads flat config), so
// `npm run lint` failed with "ESLint couldn't find an eslint.config.(js|mjs|cjs)"
// and killed the `preflight` workflow at the Lint step.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'build/**',
      'site/**',
      'data/**',
      'node_modules/**',
      '.refresh/**',
      'coverage/**',
      '*.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
      'no-process-exit': 'off',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
);
