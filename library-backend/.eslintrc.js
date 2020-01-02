module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true
  },
  plugins: ['jest'],
  extends: ['plugin:jest/recommended', 'eslint:recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'never']
  }
}
