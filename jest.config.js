/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/server/**/*.spec.ts', '<rootDir>/test/unit/**/*.spec.ts'],
  moduleNameMapper: {
    '^@server/(.*)$': '<rootDir>/server/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@client/(.*)$': '<rootDir>/client/$1',
    '^@/(.*)$': '<rootDir>/client/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.node.json',
        diagnostics: false,
      },
    ],
  },
};
