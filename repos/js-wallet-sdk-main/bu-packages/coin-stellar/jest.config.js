/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...require('../../jest.config.base.js'),
  displayName: 'coin-stellar',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
    '^.*/coin-stellar/src/lib/.*\\.js$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
    // '^.+\\.js$': 'babel-jest' // If you need to transform JS files as well, you can use Babel or other JS transpilers
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|js)$', // Match .test.ts, .test.js, .spec.ts and .spec.js files
};
