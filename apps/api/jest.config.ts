import type {Config} from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    // collectCoverage: true,
    // collectCoverageFrom: ['!node_modules','src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/index.ts'],
    // coverageReporters: ['lcov', 'text-summary'],
};
export default config;
