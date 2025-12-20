/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'prettier'],
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'dist/',
    'coverage/',
    'playwright-report/',
    'test-results/',
  ],
  overrides: [
    {
      files: ['packages/ui/**/*.{js,jsx,ts,tsx}'],
      rules: {
        '@next/next/no-html-link-for-pages': 'off',
      },
    },
    {
      files: [
        'apps/web/src/app/**/*.{js,jsx,ts,tsx}',
        'apps/web/src/components/**/*.{js,jsx,ts,tsx}',
      ],
      rules: {
        'react/no-unescaped-entities': 'off',
      },
    },
  ],
};
