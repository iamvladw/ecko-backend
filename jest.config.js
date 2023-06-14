module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    testMatch: ['**/tests/**/*.test.(ts|tsx|js|jsx)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.(ts|tsx)', '!src/**/*.test.(ts|tsx)']
};
