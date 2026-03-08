import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // JavaScript recommended rules
  js.configs.recommended,

  // TypeScript ESLint recommended rules
  ...tseslint.configs.recommended,

  // Prettier integration
  {
    plugins: {
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.es2021,
        ...globals.node,
      },
      ecmaVersion: 12,
      sourceType: 'module',
    },

    rules: {
      'prettier/prettier': 'error',
      'no-unsafe-assignment': 'off',
      'no-console': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // TypeScript specific overrides
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Apply to TypeScript and JavaScript files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
  },

  // Ignore patterns
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', '*.config.js'],
  },
];
