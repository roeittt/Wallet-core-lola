/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...require('../../jest.config.base.js'),
  displayName: 'coin-kaia',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.js$': 'babel-jest', // Transpile JS files
  },
  transformIgnorePatterns: [
    '/node_modules/(?!lodash-es|@kaiachain/ethers-ext)', // Force transpile these dependencies
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'], // Specify these extensions to be treated as ESM
  moduleNameMapper: {
    '^@kaiachain/ethers-ext/src/v6$': '<rootDir>/node_modules/@kaiachain/ethers-ext/src/v6',
    '^@kaiachain/js-ext-core/util$': '<rootDir>/node_modules/@kaiachain/js-ext-core/util',
    '^@kaiachain/js-ext-core/ethers-v6$': '<rootDir>/node_modules/@kaiachain/js-ext-core/ethers-v6',
  },
};
