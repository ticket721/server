module.exports = {
  name: 'content-manager',
  displayName: 'Content Manager',
  testMatch: ['**/ethereum_utils/?(*.)+(spec|ethereum_utils).js'],
  coveragePathIgnorePatterns: [
    '<rootDir>/admin/',
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/out-tsc/',
    '<rootDir>/ethereum_utils/'
  ]
};
