const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expo,
  { ignores: ['dist/**', '.expo/**', 'android/**', 'ios/**', 'coverage/**'] },
  { rules: { '@typescript-eslint/no-explicit-any': 'error', 'react-hooks/exhaustive-deps': 'error' } },
]);
