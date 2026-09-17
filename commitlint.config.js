/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  helpUrl:
    'https://www.conventionalcommits.org/en/v1.0.0/#summary — see docs/CONTRIBUTING.md#commit-messages',
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // new user-facing capability
        'fix', // bug fix
        'docs', // docs only
        'style', // formatting / UI chrome (no logic change)
        'refactor', // code change without feat/fix
        'perf', // performance
        'test', // tests
        'build', // build system / packaging
        'ci', // CI config
        'chore', // maintenance / deps / tooling
        'revert', // revert a prior commit
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'toolbar',
        'popup',
        'options',
        'onboarding',
        'settings',
        'reader',
        'speech',
        'focus',
        'zoom',
        'summary',
        'a11y',
        'i18n',
        'core',
        'content',
        'background',
        'ui',
        'deps',
        'release',
        'husky',
        'lint',
        'test',
        'docs',
        'ci',
      ],
    ],
    'scope-empty': [1, 'never'], // prefer a scope; warn if missing
    'subject-case': [2, 'never', ['pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [1, 'always'],
  },
};
