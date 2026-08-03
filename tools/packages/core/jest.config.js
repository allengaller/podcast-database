module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      // Tracked at 85% lines / 70% branches: matches current state of
      // services/* + utils/*. The PodcastEngine has a few uncovered branches
      // around fallback paths that we will close in a follow-up.
      branches: 70,
      functions: 95,
      lines: 85,
      statements: 85,
    },
  },
};
