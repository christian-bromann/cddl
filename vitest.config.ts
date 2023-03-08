/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        exclude: [],
        coverage: {
            enabled: true,
            lines: 92,
            functions: 88,
            branches: 92,
            statements: 92
        }
    }
})