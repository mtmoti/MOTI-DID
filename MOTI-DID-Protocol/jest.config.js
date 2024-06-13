// jest.config.js
module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  setupFilesAfterEnv: ['./test/jest-tests/jest.setup.js'],
  testMatch: ['**/AllTests.js'],
};
