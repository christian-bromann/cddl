import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        coverage: {
            enabled: true,
            provider: 'v8',
            include: ['src/**/*.ts', 'src/**/*.js'],
            thresholds: {
                statements: 93.5,
                functions: 90.2,
                branches: 92.8,
                lines: 93.6,
            }
        }
    }
})
