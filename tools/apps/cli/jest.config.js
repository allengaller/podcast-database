module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/scripts/**',
    // Entry points exercised by E2E, not unit tests. Excluding them keeps
    // the meaningful coverage metric focused on services + utils.
    '!src/cli.ts',
    '!src/mcp-server.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      // The CLI has two entry points (cli.ts and mcp-server.ts) which are
      // exercised by E2E rather than unit tests. Coverage threshold here
      // tracks the testable services + utils, where we already sit at
      // ~98% statements.
      branches: 50,
      functions: 60,
      lines: 50,
      statements: 50,
    },
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  clearMocks: true,
  restoreMocks: true,
  verbose: true,
};
