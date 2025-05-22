import pluginJs from '@eslint/js';
import { flatConfigs } from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  { ignores: ['dist'] },
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  pluginJs.configs.recommended,
  flatConfigs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  reactHooks.configs['recommended-latest'],
  jsxA11y.flatConfigs.recommended,
  eslintPluginPrettierRecommended,
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    rules: {
      'react/display-name': 'off',
      'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
      'react/no-array-index-key': 'error',
      'react/no-this-in-sfc': 'error',
      'react/destructuring-assignment': 'error',
      'react/jsx-boolean-value': 'error',
      'react/require-default-props': ['error', { functions: 'defaultArguments' }],
      'react/jsx-curly-brace-presence': [
        'error',
        { propElementValues: 'always', props: 'never', children: 'never' },
      ],
      'prefer-template': 'error',
      'object-shorthand': ['error', 'always'],
      'react/jsx-no-useless-fragment': 'error',
      'react/self-closing-comp': 'error',

      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-autofocus': 'off',

      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import-x/extensions': ['error', 'always', { ignorePackages: true }],
      'import-x/no-relative-packages': 'error',
      'import-x/no-named-as-default': 'off',

      'no-console': 'error',
      camelcase: [
        'error',
        { allow: ['UNSAFE_componentWillReceiveProps', 'UNSAFE_componentWillMount'] },
      ],
    },
  },
];
