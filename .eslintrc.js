// @ts-check
'use strict';

const OFF = 'off';
const ERROR = 'error';
const WARN = 'warn';

/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  env: {
    node: true,
    jest: true,
  },
  plugins: ['import'],
  root: true,
  ignorePatterns: ['dist/'],
  extends: [
    'plugin:prettier/recommended',
    'plugin:sonarjs/recommended',
    'plugin:unicorn/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  rules: {
    'no-console': WARN,
    'no-debugger': WARN,
    'max-len': [
      ERROR,
      120,
      4,
      {
        ignoreComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      },
    ],
    curly: ERROR,
    'no-implicit-coercion': ERROR,
    'no-else-return': ERROR,
    'no-duplicate-imports': [ERROR, { includeExports: true }],
    'import/first': ERROR,
    'import/no-mutable-exports': ERROR,
    'import/no-self-import': ERROR,
    'import/no-named-default': ERROR,
    'import/order': [
      ERROR,
      {
        'newlines-between': 'always',
        groups: [
          ['builtin', 'external'],
          'internal',
          'parent',
          'sibling',
          'type',
          'index',
          'object',
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: false,
        },
      },
    ],
    'unicorn/no-useless-undefined': [ERROR, { checkArguments: false }],
    'unicorn/prevent-abbreviations': ERROR,
    'unicorn/prefer-module': OFF,
    'import/no-cycle': OFF,
    'node/no-unsupported-features/es-syntax': OFF,
    'sonarjs/no-duplicate-string': OFF,
    'unicorn/prefer-ternary': OFF,
    'unicorn/prefer-top-level-await': OFF,
    'unicorn/no-array-reduce': OFF,
    'unicorn/no-null': OFF,
  },
  overrides: [
    {
      files: ['*.ts'],
      plugins: ['@typescript-eslint/eslint-plugin'],
      extends: ['plugin:@typescript-eslint/recommended'],
      parserOptions: {
        ecmaVersion: 2022,
        project: ['tsconfig.json'],
      },
      rules: {
        '@typescript-eslint/no-empty-function': [
          ERROR,
          {
            allow: ['arrowFunctions'],
          },
        ],
        '@typescript-eslint/no-explicit-any': OFF,
        '@typescript-eslint/no-unused-vars': [
          ERROR,
          {
            vars: 'local',
            ignoreRestSiblings: false,
            argsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/naming-convention': [
          ERROR,
          {
            selector: 'interface',
            format: ['PascalCase'],
          },
        ],
        '@typescript-eslint/ban-ts-comment': [
          ERROR,
          {
            'ts-expect-error': 'allow-with-description',
            'ts-ignore': true,
            'ts-nocheck': true,
            'ts-check': false,
            minimumDescriptionLength: 5,
          },
        ],
        '@typescript-eslint/member-ordering': [
          ERROR,
          {
            default: [
              'static-field',
              'static-get',
              'static-set',
              'static-method',
              'protected-decorated-field',
              'private-decorated-field',
              'public-decorated-field',
              'protected-instance-field',
              'private-instance-field',
              'public-instance-field',
              'constructor',
              'instance-field',
              'abstract-field',
              'instance-get',
              'abstract-get',
              'instance-set',
              'abstract-set',
              'instance-method',
              'protected-instance-method',
              'private-instance-method',
              'abstract-method',
            ],
          },
        ],
        '@typescript-eslint/array-type': [
          ERROR,
          { default: 'array-simple', readonly: 'array-simple' },
        ],
        '@typescript-eslint/no-base-to-string': ERROR,
        '@typescript-eslint/prefer-regexp-exec': ERROR,
        '@typescript-eslint/consistent-generic-constructors': ERROR,
        '@typescript-eslint/prefer-nullish-coalescing': ERROR,
        '@typescript-eslint/prefer-optional-chain': ERROR,
        '@typescript-eslint/no-non-null-assertion': ERROR,
        '@typescript-eslint/return-await': [ERROR, 'always'],
        'no-return-await': OFF,
        'unicorn/prefer-module': ERROR,
        'unicorn/no-array-callback-reference': OFF,
        'unicorn/no-array-method-this-argument': OFF,
      },
    },
    {
      files: ['*rc.js', '*rc.cjs'],
      rules: {
        'unicorn/prefer-module': OFF,
      },
    },
    {
      files: ['*.json', '*.json5'],
      parser: 'jsonc-eslint-parser',
      extends: ['plugin:jsonc/recommended-with-json'],
    },
  ],
};
