const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expo,
  { ignores: ['dist/**', '.expo/**', 'android/**', 'ios/**', 'coverage/**'] },
  { files: ['**/*.ts', '**/*.tsx'], rules: { '@typescript-eslint/no-explicit-any': 'error' } },
  { files: ['**/*.{js,jsx,ts,tsx}'], rules: { 'react-hooks/exhaustive-deps': 'error' } },
]);
